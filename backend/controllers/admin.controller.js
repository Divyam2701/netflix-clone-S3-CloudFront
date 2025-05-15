import { S3Client, PutObjectCommand } from '@aws-sdk/client-s3';
import jwt from 'jsonwebtoken';
import { ENV_VARS } from '../config/env.config.js';
import { exec } from 'child_process';
import path from 'path';

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
  const { tmdbId } = req.body;
  const file = req.file;
  if (!tmdbId || !file) {
    return res.status(400).json({ success: false, message: 'TMDB ID and video file are required' });
  }
  const ext = file.originalname.split('.').pop();
  const key = `trailers/${tmdbId}.${ext}`;
  try {
    await s3.send(
      new PutObjectCommand({
        Bucket: ENV_VARS.S3_BUCKET,
        Key: key,
        Body: file.buffer,
        ContentType: file.mimetype,
      })
    );
    // Regenerate trailerMap.json after upload
    const scriptPath = path.resolve(process.cwd(), '../scripts/generateTrailerMapS3.js');
    exec(`node "${scriptPath}"`, (error, stdout, stderr) => {
      if (error) {
        console.error('Failed to regenerate trailerMap.json:', error);
      } else {
        console.log('trailerMap.json regenerated:', stdout);
      }
    });
    res.json({ success: true, key });
  } catch (err) {
    res.status(500).json({ success: false, message: 'S3 upload failed: ' + err.message });
  }
};
