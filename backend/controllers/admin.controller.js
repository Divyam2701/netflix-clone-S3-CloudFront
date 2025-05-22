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

    // Upload the file to S3 as trailers/{tmdbId}.mp4
    const s3Key = `trailers/${tmdbId}.mp4`;
    await s3.send(
      new PutObjectCommand({
        Bucket: ENV_VARS.S3_BUCKET,
        Key: s3Key,
        Body: fs.readFileSync(tempPath),
        ContentType: 'video/mp4',
      })
    );

    // Clean up temp file
    fs.unlinkSync(tempPath);

    // Update trailerMap.json after successful upload
    const dataDir = path.resolve('data');
    if (!fs.existsSync(dataDir)) {
      fs.mkdirSync(dataDir, { recursive: true });
    }
    const trailerMapPath = path.join(dataDir, 'trailerMap.json');
    let trailerMap = {};
    if (fs.existsSync(trailerMapPath)) {
      trailerMap = JSON.parse(fs.readFileSync(trailerMapPath, 'utf-8'));
    }
    trailerMap[`${tmdbId}.mp4`] = `trailers/${tmdbId}.mp4`;
    fs.writeFileSync(trailerMapPath, JSON.stringify(trailerMap, null, 2));

    res.json({
      success: true,
      videoUrl: `${ENV_VARS.CLOUDFRONT_URL}/trailers/${tmdbId}.mp4`,
    });
  } catch (err) {
    console.error('adminUpload error:', err);
    res.status(500).json({ success: false, message: err.message || 'Internal server error' });
  }
};
