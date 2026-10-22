import { Router } from 'express';
import multer from 'multer';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';
import pool from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();
const __dirname = path.dirname(fileURLToPath(import.meta.url));
const uploadsDir = path.join(__dirname, '..', 'uploads');

if (!fs.existsSync(uploadsDir)) {
  fs.mkdirSync(uploadsDir, { recursive: true });
}

const storage = multer.diskStorage({
  destination: (_req, _file, cb) => cb(null, uploadsDir),
  filename: (_req, file, cb) => {
    const ext = path.extname(file.originalname) || '.mp4';
    cb(null, `${Date.now()}-${Math.round(Math.random() * 1e9)}${ext}`);
  },
});

const upload = multer({
  storage,
  limits: { fileSize: 100 * 1024 * 1024 },
  fileFilter: (_req, file, cb) => {
    if (file.mimetype.startsWith('video/')) cb(null, true);
    else cb(new Error('Only video files are allowed'));
  },
});

function timeAgo(date) {
  const seconds = Math.floor((Date.now() - new Date(date).getTime()) / 1000);
  if (seconds < 60) return 'now';
  if (seconds < 3600) return `${Math.floor(seconds / 60)}m`;
  if (seconds < 86400) return `${Math.floor(seconds / 3600)}h`;
  return `${Math.floor(seconds / 86400)}d`;
}

function mapComment(row, viewerId) {
  return {
    id: row.id,
    parentId: row.parent_id,
    userId: row.user_id,
    username: row.username,
    avatar: row.avatar,
    text: row.text,
    timestamp: timeAgo(row.created_at),
    likes: row.likes,
    liked: row.liked,
    isMine: viewerId ? row.user_id === viewerId : false,
    replies: [],
  };
}

router.get('/', optionalAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        v.id::text,
        v.url,
        v.description,
        v.shares,
        u.username,
        u.avatar,
        (SELECT COUNT(*)::int FROM likes WHERE video_id = v.id) AS likes,
        (SELECT COUNT(*)::int FROM comments WHERE video_id = v.id) AS comments,
        CASE WHEN $1::uuid IS NULL THEN false
             ELSE EXISTS(SELECT 1 FROM likes WHERE video_id = v.id AND user_id = $1)
        END AS liked
      FROM videos v
      JOIN users u ON u.id = v.user_id
      ORDER BY v.created_at DESC`,
      [req.userId || null]
    );
    res.json({ videos: rows });
  } catch (err) {
    console.error('Feed error:', err);
    res.status(500).json({ error: 'Failed to load videos' });
  }
});

router.post('/', requireAuth, upload.single('video'), async (req, res) => {
  try {
    if (!req.file) {
      return res.status(400).json({ error: 'Video file is required' });
    }

    const description = (req.body.description || '').trim();
    const url = `http://localhost:${process.env.PORT || 3001}/uploads/${req.file.filename}`;

    const { rows } = await pool.query(
      `INSERT INTO videos (user_id, url, description)
       VALUES ($1, $2, $3)
       RETURNING id::text, url, description, shares`,
      [req.userId, url, description]
    );

    const user = await pool.query(
      'SELECT username, avatar FROM users WHERE id = $1',
      [req.userId]
    );

    res.status(201).json({
      video: {
        ...rows[0],
        username: user.rows[0].username,
        avatar: user.rows[0].avatar,
        likes: 0,
        comments: 0,
        liked: false,
      },
    });
  } catch (err) {
    console.error('Upload error:', err);
    res.status(500).json({ error: err.message || 'Upload failed' });
  }
});

router.post('/comments/:commentId/like', requireAuth, async (req, res) => {
  try {
    const commentId = req.params.commentId;
    const existing = await pool.query(
      'SELECT id FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
      [req.userId, commentId]
    );

    let liked;
    if (existing.rows.length > 0) {
      await pool.query(
        'DELETE FROM comment_likes WHERE user_id = $1 AND comment_id = $2',
        [req.userId, commentId]
      );
      liked = false;
    } else {
      await pool.query(
        'INSERT INTO comment_likes (user_id, comment_id) VALUES ($1, $2)',
        [req.userId, commentId]
      );
      liked = true;
    }

    const count = await pool.query(
      'SELECT COUNT(*)::int AS likes FROM comment_likes WHERE comment_id = $1',
      [commentId]
    );

    res.json({ liked, likes: count.rows[0].likes });
  } catch (err) {
    console.error('Comment like error:', err);
    res.status(500).json({ error: 'Failed to like comment' });
  }
});

router.post('/:id/like', requireAuth, async (req, res) => {
  try {
    const videoId = req.params.id;
    const existing = await pool.query(
      'SELECT id FROM likes WHERE user_id = $1 AND video_id = $2',
      [req.userId, videoId]
    );

    let liked;
    if (existing.rows.length > 0) {
      await pool.query('DELETE FROM likes WHERE user_id = $1 AND video_id = $2', [
        req.userId,
        videoId,
      ]);
      liked = false;
    } else {
      await pool.query('INSERT INTO likes (user_id, video_id) VALUES ($1, $2)', [
        req.userId,
        videoId,
      ]);
      liked = true;
    }

    const count = await pool.query(
      'SELECT COUNT(*)::int AS likes FROM likes WHERE video_id = $1',
      [videoId]
    );

    res.json({ liked, likes: count.rows[0].likes });
  } catch (err) {
    console.error('Like error:', err);
    res.status(500).json({ error: 'Failed to like video' });
  }
});

router.post('/:id/share', optionalAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'UPDATE videos SET shares = shares + 1 WHERE id = $1 RETURNING shares',
      [req.params.id]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Video not found' });
    res.json({ shares: rows[0].shares });
  } catch (err) {
    console.error('Share error:', err);
    res.status(500).json({ error: 'Failed to share' });
  }
});

router.delete('/comments/:commentId', requireAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      'SELECT id, user_id, video_id, parent_id FROM comments WHERE id = $1',
      [req.params.commentId]
    );
    if (!rows[0]) return res.status(404).json({ error: 'Comment not found' });
    if (rows[0].user_id !== req.userId) {
      return res.status(403).json({ error: 'You can only delete your own comments' });
    }

    // Count this comment + its replies (if top-level) before delete
    let removed = 1;
    if (!rows[0].parent_id) {
      const replies = await pool.query(
        'SELECT COUNT(*)::int AS n FROM comments WHERE parent_id = $1',
        [req.params.commentId]
      );
      removed += replies.rows[0].n;
    }

    await pool.query('DELETE FROM comments WHERE id = $1', [req.params.commentId]);

    res.json({ ok: true, removed, videoId: rows[0].video_id });
  } catch (err) {
    console.error('Delete comment error:', err);
    res.status(500).json({ error: 'Failed to delete comment' });
  }
});

router.get('/:id/comments', optionalAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        c.id::text,
        c.parent_id::text AS parent_id,
        c.user_id::text AS user_id,
        c.text,
        c.created_at,
        u.username,
        u.avatar,
        (SELECT COUNT(*)::int FROM comment_likes WHERE comment_id = c.id) AS likes,
        CASE WHEN $2::uuid IS NULL THEN false
             ELSE EXISTS(SELECT 1 FROM comment_likes WHERE comment_id = c.id AND user_id = $2)
        END AS liked
      FROM comments c
      JOIN users u ON u.id = c.user_id
      WHERE c.video_id = $1
      ORDER BY c.created_at ASC`,
      [req.params.id, req.userId || null]
    );

    const mapped = rows.map((row) => mapComment(row, req.userId));
    const roots = [];
    const byId = new Map();

    for (const c of mapped) {
      byId.set(c.id, c);
    }
    for (const c of mapped) {
      if (c.parentId && byId.has(c.parentId)) {
        byId.get(c.parentId).replies.push(c);
      } else if (!c.parentId) {
        roots.push(c);
      }
    }

    roots.reverse();
    res.json({ comments: roots });
  } catch (err) {
    console.error('Comments error:', err);
    res.status(500).json({ error: 'Failed to load comments' });
  }
});

router.post('/:id/comments', requireAuth, async (req, res) => {
  try {
    const text = (req.body.text || '').trim();
    const parentId = req.body.parentId || null;
    if (!text) return res.status(400).json({ error: 'Comment text is required' });

    if (parentId) {
      const parent = await pool.query(
        'SELECT id, video_id, parent_id FROM comments WHERE id = $1',
        [parentId]
      );
      if (!parent.rows[0] || parent.rows[0].video_id !== req.params.id) {
        return res.status(400).json({ error: 'Invalid parent comment' });
      }
      if (parent.rows[0].parent_id) {
        return res.status(400).json({ error: 'Can only reply to top-level comments' });
      }
    }

    const { rows } = await pool.query(
      `INSERT INTO comments (user_id, video_id, text, parent_id)
       VALUES ($1, $2, $3, $4)
       RETURNING id::text, text, created_at, parent_id::text AS parent_id`,
      [req.userId, req.params.id, text, parentId]
    );

    const user = await pool.query(
      'SELECT username, avatar FROM users WHERE id = $1',
      [req.userId]
    );

    res.status(201).json({
      comment: {
        id: rows[0].id,
        parentId: rows[0].parent_id,
        userId: req.userId,
        username: user.rows[0].username,
        avatar: user.rows[0].avatar,
        text: rows[0].text,
        timestamp: 'now',
        likes: 0,
        liked: false,
        isMine: true,
        replies: [],
      },
    });
  } catch (err) {
    console.error('Add comment error:', err);
    res.status(500).json({ error: 'Failed to add comment' });
  }
});

export default router;
