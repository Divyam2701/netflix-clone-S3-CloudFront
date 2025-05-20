import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';
import { exec } from 'child_process';
import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import jwt from 'jsonwebtoken';
import { ENV_VARS } from '../config/env.config.js';

const ADMIN_USERNAME = process.env.ADMIN_USERNAME || 'admin';
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD || 'admin123';
const JWT_SECRET = ENV_VARS.JWT_SECRET || 'secret';

const s3 = new S3Client({ region: ENV_VARS.AWS_REGION || 'us-west-1' });

export const adminLogin = (req, res) => {
  const { username, password } = req.body;
  if (username === ADMIN_USERNAME && password === ADMIN_PASSWORD) {
    const token = jwt.sign({ admin: true }, JWT_SECRET, { expiresIn: '1d' });
    res.cookie('adminToken', token, {
      httpOnly: true,
      secure: ENV_VARS.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 24 * 60 * 60 * 1000,
    });
    return res.json({ success: true });
  }
  res.status(401).json({ success: false, message: 'Invalid admin credentials' });
};

export const adminCheck = (req, res) => {
  res.json({ success: true, admin: true });
};

export const adminLogout = (req, res) => {
  res.clearCookie('adminToken');
  res.json({ success: true });
};

export const adminUpload = async (req, res) => {
  try {
    const { tmdbId } = req.body;
    const file = req.file;
    if (!tmdbId || !file) {
      return res.status(400).json({ success: false, message: 'TMDB ID and video file are required' });
    }
    // Save uploaded MP4 temporarily
    const tempPath = path.join(os.tmpdir(), `${tmdbId}_original_${Date.now()}.mp4`);
    fs.writeFileSync(tempPath, file.buffer);

    // Use import.meta.url to get __dirname equivalent
    const __filename = fileURLToPath(import.meta.url);
    const __dirname = path.dirname(__filename);

    // Output directory for HLS (inside your project folder)
    const hlsRoot = path.resolve(__dirname, '../../hls_output');
    if (!fs.existsSync(hlsRoot)) fs.mkdirSync(hlsRoot, { recursive: true });
    const hlsDir = path.join(hlsRoot, `hls_${tmdbId}_${Date.now()}`);
    fs.mkdirSync(hlsDir);

    // ffmpeg command for multi-resolution HLS
    const ffmpegCmd =
      `ffmpeg -y -i "${tempPath}" ` +
      `-filter_complex "[0:v]split=4[v1][v2][v3][v4];` +
      `[v1]scale=w=1920:h=1080:force_original_aspect_ratio=decrease[v1out];` +
      `[v2]scale=w=1280:h=720:force_original_aspect_ratio=decrease[v2out];` +
      `[v3]scale=w=854:h=480:force_original_aspect_ratio=decrease[v3out];` +
      `[v4]scale=w=640:h=360:force_original_aspect_ratio=decrease[v4out]" ` +
      `-map "[v1out]" -c:v:0 libx264 -b:v:0 5000k -map a:0 -c:a:0 aac -b:a:0 192k -f hls -hls_time 6 -hls_playlist_type vod -hls_segment_filename "${hlsDir}/1080p_%03d.ts" "${hlsDir}/1080p.m3u8" ` +
      `-map "[v2out]" -c:v:1 libx264 -b:v:1 3000k -map a:0 -c:a:1 aac -b:a:1 128k -f hls -hls_time 6 -hls_playlist_type vod -hls_segment_filename "${hlsDir}/720p_%03d.ts" "${hlsDir}/720p.m3u8" ` +
      `-map "[v3out]" -c:v:2 libx264 -b:v:2 1500k -map a:0 -c:a:2 aac -b:a:2 96k -f hls -hls_time 6 -hls_playlist_type vod -hls_segment_filename "${hlsDir}/480p_%03d.ts" "${hlsDir}/480p.m3u8" ` +
      `-map "[v4out]" -c:v:3 libx264 -b:v:3 800k -map a:0 -c:a:3 aac -b:a:3 64k -f hls -hls_time 6 -hls_playlist_type vod -hls_segment_filename "${hlsDir}/360p_%03d.ts" "${hlsDir}/360p.m3u8"`;

    await new Promise((resolve, reject) => {
      exec(ffmpegCmd, (error, stdout, stderr) => {
        console.log('ffmpeg stdout:', stdout);
        console.log('ffmpeg stderr:', stderr);
        if (error) {
          console.error('ffmpeg error:', error);
          return reject(error);
        }
        resolve();
      });
    });

    // Debug: List files in HLS output directory
    console.log('HLS output directory:', hlsDir);
    console.log('HLS output files:', fs.readdirSync(hlsDir));

    // Generate master playlist
    const masterPlaylist = `
#EXTM3U
#EXT-X-VERSION:3
#EXT-X-STREAM-INF:BANDWIDTH=5000000,RESOLUTION=1920x1080
1080p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=3000000,RESOLUTION=1280x720
720p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=1500000,RESOLUTION=854x480
480p.m3u8
#EXT-X-STREAM-INF:BANDWIDTH=800000,RESOLUTION=640x360
360p.m3u8
    `.trim();
    fs.writeFileSync(path.join(hlsDir, 'master.m3u8'), masterPlaylist);

    // Recursively upload all files in a directory to S3
    async function uploadDirToS3(dir, s3Prefix) {
      const files = fs.readdirSync(dir, { withFileTypes: true });
      for (const file of files) {
        const filePath = path.join(dir, file.name);
        if (file.isDirectory()) {
          await uploadDirToS3(filePath, `${s3Prefix}/${file.name}`);
        } else {
          const key = `${s3Prefix}/${file.name}`;
          const contentType = file.name.endsWith('.m3u8')
            ? 'application/vnd.apple.mpegurl'
            : file.name.endsWith('.ts')
            ? 'video/MP2T'
            : 'application/octet-stream';
          await s3.send(
            new PutObjectCommand({
              Bucket: ENV_VARS.S3_BUCKET,
              Key: key,
              Body: fs.readFileSync(filePath),
              ContentType: contentType,
            })
          );
        }
      }
    }
    await uploadDirToS3(hlsDir, `trailers/${tmdbId}`);

    // Clean up temp files
    fs.unlinkSync(tempPath);
    fs.rmSync(hlsDir, { recursive: true, force: true });

    res.json({
      success: true,
      hlsMasterUrl: `${ENV_VARS.CLOUDFRONT_URL}/trailers/${tmdbId}/master.m3u8`,
    });
  } catch (err) {
    console.error('adminUpload error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
