// This script lists video files in your S3 bucket (e.g., trailers/603.mp4),
// extracts TMDB IDs, and generates data/trailerMap.json for backend use.

import fs from 'fs';
import path from 'path';
import { S3Client, ListObjectsV2Command } from '@aws-sdk/client-s3';

// --- CONFIGURATION ---
const S3_BUCKET = process.env.S3_BUCKET || 'tmdb-movie-trailer';
const TRAILER_PREFIX = 'trailers/'; // Folder in S3 where trailers are stored
const OUTPUT_FILE = path.resolve('../data/trailerMap.json'); // Output mapping file

// Ensure the output directory exists
const OUTPUT_DIR = path.dirname(OUTPUT_FILE);
if (!fs.existsSync(OUTPUT_DIR)) {
  fs.mkdirSync(OUTPUT_DIR, { recursive: true });
}

// --- AWS S3 CLIENT ---
const s3 = new S3Client({ region: process.env.AWS_REGION || 'us-west-1' });

async function generateTrailerMap() {
  const map = {};

  // List objects in the S3 bucket under the trailers/ prefix
  const command = new ListObjectsV2Command({
    Bucket: S3_BUCKET,
    Prefix: TRAILER_PREFIX,
  });

  try {
    const data = await s3.send(command);
    if (!data.Contents) {
      console.log('No files found in S3.');
      return;
    }

    data.Contents.forEach((item) => {
      const key = item.Key;
      // Expecting keys like trailers/603.mp4, trailers/550.mp4, etc.
      const match = key.match(/^trailers\/(\d+)\.(mp4|mov|webm)$/i);
      if (match) {
        const tmdbId = match[1];
        map[tmdbId] = key;
      }
    });

    // Write the mapping to trailerMap.json
    fs.writeFileSync(OUTPUT_FILE, JSON.stringify(map, null, 2));
    console.log(`Mapping generated: ${OUTPUT_FILE}`);
  } catch (err) {
    console.error('Error listing S3 objects:', err);
  }
}

generateTrailerMap();
