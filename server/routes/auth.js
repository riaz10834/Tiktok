import { Router } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../db.js';
import { requireAuth } from '../middleware/auth.js';
import { uploadPublicUrl } from '../publicUrl.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const avatarUpload = multer({
  storage: multer.diskStorage({
    destination: (_req, _file, cb) => cb(null, uploadsDir),
    filename: (_req, file, cb) => {
      const ext = path.extname(file.originalname) || '.jpg';
      cb(null, `avatar-${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
    },
  }),
  limits: { fileSize: 5 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('image/')) cb(null, true);
    else cb(new Error('Only image files are allowed'));
  },
});

function signToken(userId) {
  return jwt.sign({ userId }, process.env.JWT_SECRET, { expiresIn: '30d' });
}

async function getUserProfile(userId) {
  const { rows } = await pool.query(
    `SELECT
      u.id,
      u.username,
      u.display_name AS "displayName",
      u.email,
      u.avatar,
      u.bio,
      (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) AS followers,
      (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) AS following,
      (SELECT COUNT(*)::int FROM likes l
        JOIN videos v ON v.id = l.video_id
        WHERE v.user_id = u.id) AS likes
    FROM users u
    WHERE u.id = $1`,
    [userId]
  );
  return rows[0] || null;
}

router.post('/register', async (req, res) => {
  try {
    const { username, displayName, email, password } = req.body;

    if (!username?.trim() || !email?.trim() || !password) {
      return res.status(400).json({ error: 'Username, email and password are required' });
    }
    if (password.length < 4) {
      return res.status(400).json({ error: 'Password must be at least 4 characters' });
    }

    const cleanUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
    const cleanEmail = email.trim().toLowerCase();
    const cleanDisplay = (displayName || username).trim();

    const existing = await pool.query(
      'SELECT id FROM users WHERE username = $1 OR email = $2',
      [cleanUsername, cleanEmail]
    );
    if (existing.rows.length > 0) {
      return res.status(409).json({ error: 'Username or email already exists' });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    const { rows } = await pool.query(
      `INSERT INTO users (username, display_name, email, password_hash)
       VALUES ($1, $2, $3, $4)
       RETURNING id`,
      [cleanUsername, cleanDisplay, cleanEmail, passwordHash]
    );

    const user = await getUserProfile(rows[0].id);
    const token = signToken(user.id);
    res.status(201).json({ token, user });
  } catch (err) {
    console.error('Register error:', err);
    res.status(500).json({ error: 'Registration failed' });
  }
});

router.post('/login', async (req, res) => {
  try {
    const { email, password } = req.body;
    if (!email?.trim() || !password) {
      return res.status(400).json({ error: 'Email and password are required' });
    }

    const { rows } = await pool.query(
      'SELECT id, password_hash FROM users WHERE email = $1 OR username = $1',
      [email.trim().toLowerCase()]
    );

    if (rows.length === 0) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const valid = await bcrypt.compare(password, rows[0].password_hash);
    if (!valid) {
      return res.status(401).json({ error: 'Invalid email or password' });
    }

    const user = await getUserProfile(rows[0].id);
    const token = signToken(user.id);
    res.json({ token, user });
  } catch (err) {
    console.error('Login error:', err);
    res.status(500).json({ error: 'Login failed' });
  }
});

router.get('/me', requireAuth, async (req, res) => {
  try {
    const user = await getUserProfile(req.userId);
    if (!user) return res.status(404).json({ error: 'User not found' });
    res.json({ user });
  } catch (err) {
    console.error('Me error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

router.put('/profile', requireAuth, avatarUpload.single('avatar'), async (req, res) => {
  try {
    const { displayName, bio, username, avatarUrl } = req.body;

    const current = await pool.query(
      'SELECT username, display_name, bio, avatar FROM users WHERE id = $1',
      [req.userId]
    );
    if (!current.rows[0]) return res.status(404).json({ error: 'User not found' });

    let newUsername = current.rows[0].username;
    if (username?.trim()) {
      newUsername = username.trim().toLowerCase().replace(/\s+/g, '_');
      if (newUsername !== current.rows[0].username) {
        const taken = await pool.query(
          'SELECT id FROM users WHERE username = $1 AND id <> $2',
          [newUsername, req.userId]
        );
        if (taken.rows.length > 0) {
          return res.status(409).json({ error: 'Username already taken' });
        }
      }
    }

    const newDisplay =
      displayName !== undefined && displayName !== null
        ? String(displayName).trim() || current.rows[0].display_name
        : current.rows[0].display_name;
    const newBio =
      bio !== undefined && bio !== null ? String(bio).trim() : current.rows[0].bio;

    let newAvatar = current.rows[0].avatar;
    if (req.file) {
      newAvatar = uploadPublicUrl(req, req.file.filename);
    } else if (avatarUrl?.trim()) {
      newAvatar = avatarUrl.trim();
    }

    await pool.query(
      `UPDATE users
       SET username = $1, display_name = $2, bio = $3, avatar = $4
       WHERE id = $5`,
      [newUsername, newDisplay, newBio, newAvatar, req.userId]
    );

    const user = await getUserProfile(req.userId);
    res.json({ user });
  } catch (err) {
    console.error('Update profile error:', err);
    res.status(500).json({ error: err.message || 'Failed to update profile' });
  }
});

export default router;
