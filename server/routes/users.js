import { Router } from 'express';
import pool from '../db.js';
import { requireAuth, optionalAuth } from '../middleware/auth.js';

const router = Router();

router.get('/search', optionalAuth, async (req, res) => {
  try {
    const q = (req.query.q || '').trim();
    const params = [];
    let where = '';

    if (q) {
      params.push(`%${q.toLowerCase()}%`);
      where = 'WHERE LOWER(u.username) LIKE $1 OR LOWER(u.display_name) LIKE $1';
    }

    const viewerParam = req.userId || null;
    params.push(viewerParam);
    const viewerIdx = params.length;

    const { rows } = await pool.query(
      `SELECT
        u.id::text,
        u.username,
        u.display_name AS "displayName",
        u.avatar,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) AS followers,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) AS following,
        CASE WHEN $${viewerIdx}::uuid IS NULL THEN false
             ELSE EXISTS(
               SELECT 1 FROM follows
               WHERE follower_id = $${viewerIdx} AND following_id = u.id
             )
        END AS "isFollowing"
      FROM users u
      ${where}
      ORDER BY followers DESC
      LIMIT 20`,
      params
    );

    res.json({ users: rows });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed' });
  }
});

router.get('/:id/profile', optionalAuth, async (req, res) => {
  try {
    const { rows } = await pool.query(
      `SELECT
        u.id::text,
        u.username,
        u.display_name AS "displayName",
        u.avatar,
        u.bio,
        (SELECT COUNT(*)::int FROM follows WHERE following_id = u.id) AS followers,
        (SELECT COUNT(*)::int FROM follows WHERE follower_id = u.id) AS following,
        (SELECT COUNT(*)::int FROM likes l
          JOIN videos v ON v.id = l.video_id
          WHERE v.user_id = u.id) AS likes
      FROM users u
      WHERE u.id = $1 OR u.username = $1`,
      [req.params.id]
    );

    if (!rows[0]) return res.status(404).json({ error: 'User not found' });

    const user = rows[0];

    const myVideos = await pool.query(
      `SELECT
        v.id::text,
        v.url,
        v.url AS thumbnail,
        (SELECT COUNT(*)::int FROM likes WHERE video_id = v.id) AS likes,
        (SELECT COUNT(*)::int FROM comments WHERE video_id = v.id) AS comments,
        0 AS favorites,
        0 AS views
      FROM videos v
      WHERE v.user_id = $1
      ORDER BY v.created_at DESC`,
      [user.id]
    );

    let likedVideos = { rows: [] };
    if (req.userId && req.userId === user.id) {
      likedVideos = await pool.query(
        `SELECT
          v.id::text,
          v.url,
          v.url AS thumbnail,
          (SELECT COUNT(*)::int FROM likes WHERE video_id = v.id) AS likes,
          (SELECT COUNT(*)::int FROM comments WHERE video_id = v.id) AS comments,
          0 AS favorites,
          0 AS views
        FROM likes l
        JOIN videos v ON v.id = l.video_id
        WHERE l.user_id = $1
        ORDER BY l.created_at DESC`,
        [user.id]
      );
    }

    res.json({
      user,
      myVideos: myVideos.rows,
      likedVideos: likedVideos.rows,
      favoriteVideos: [],
    });
  } catch (err) {
    console.error('Profile error:', err);
    res.status(500).json({ error: 'Failed to load profile' });
  }
});

router.post('/:id/follow', requireAuth, async (req, res) => {
  try {
    const targetId = req.params.id;
    if (targetId === req.userId) {
      return res.status(400).json({ error: 'Cannot follow yourself' });
    }

    const existing = await pool.query(
      'SELECT id FROM follows WHERE follower_id = $1 AND following_id = $2',
      [req.userId, targetId]
    );

    let isFollowing;
    if (existing.rows.length > 0) {
      await pool.query(
        'DELETE FROM follows WHERE follower_id = $1 AND following_id = $2',
        [req.userId, targetId]
      );
      isFollowing = false;
    } else {
      await pool.query(
        'INSERT INTO follows (follower_id, following_id) VALUES ($1, $2)',
        [req.userId, targetId]
      );
      isFollowing = true;
    }

    const count = await pool.query(
      'SELECT COUNT(*)::int AS followers FROM follows WHERE following_id = $1',
      [targetId]
    );

    res.json({ isFollowing, followers: count.rows[0].followers });
  } catch (err) {
    console.error('Follow error:', err);
    res.status(500).json({ error: 'Follow failed' });
  }
});

export default router;
