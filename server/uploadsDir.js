import fs from 'fs';
import os from 'os';
import path from 'path';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function resolveDir() {
  if (process.env.VERCEL) {
    return path.join(os.tmpdir(), 'tiktok-uploads');
  }
  return path.join(__dirname, 'uploads');
}

export const uploadsDir = resolveDir();

try {
  fs.mkdirSync(uploadsDir, { recursive: true });
} catch (err) {
  console.error('Could not create uploads directory:', err.message);
}
