const pool = require('../config/db');
const { extractHashtags } = require('../utils/hashtags');

// Feed is strictly newest-first: no scoring, no decay, just chronological order.
async function getFeed(req, res, next) {
  try {
    const page = Math.max(parseInt(req.query.page, 10) || 1, 1);
    const pageSize = Math.min(Math.max(parseInt(req.query.pageSize, 10) || 20, 1), 50);
    const offset = (page - 1) * pageSize;
    const userId = req.user ? req.user.id : 0;

    const [rows] = await pool.query(
      `SELECT p.id, p.content, p.like_count, p.created_at,
              u.id AS user_id, u.username, u.display_name,
              EXISTS(
                SELECT 1 FROM likes l WHERE l.post_id = p.id AND l.user_id = ?
              ) AS liked_by_me
       FROM posts p
       JOIN users u ON u.id = p.user_id
       ORDER BY p.created_at DESC, p.id DESC
       LIMIT ? OFFSET ?`,
      [userId, pageSize, offset]
    );

    let tagMap = {};
    if (rows.length) {
      const ids = rows.map((r) => r.id);
      const [tagRows] = await pool.query(
        `SELECT ph.post_id, h.tag
         FROM post_hashtags ph
         JOIN hashtags h ON h.id = ph.hashtag_id
         WHERE ph.post_id IN (?)`,
        [ids]
      );
      tagMap = tagRows.reduce((acc, t) => {
        (acc[t.post_id] ||= []).push(t.tag);
        return acc;
      }, {});
    }

    res.json({
      page,
      pageSize,
      posts: rows.map((r) => ({
        id: r.id,
        content: r.content,
        likeCount: r.like_count,
        likedByMe: !!r.liked_by_me,
        createdAt: r.created_at,
        hashtags: tagMap[r.id] || [],
        author: { id: r.user_id, username: r.username, displayName: r.display_name },
      })),
    });
  } catch (err) {
    next(err);
  }
}

async function createPost(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const { content } = req.body;
    const userId = req.user.id;
    const tags = extractHashtags(content);

    await conn.beginTransaction();

    const [result] = await conn.query(
      'INSERT INTO posts (user_id, content) VALUES (?, ?)',
      [userId, content]
    );
    const postId = result.insertId;

    for (const tag of tags) {
      await conn.query(
        'INSERT INTO hashtags (tag) VALUES (?) ON DUPLICATE KEY UPDATE tag = tag',
        [tag]
      );
      const [[hashtagRow]] = await conn.query('SELECT id FROM hashtags WHERE tag = ?', [tag]);
      await conn.query(
        'INSERT IGNORE INTO post_hashtags (post_id, hashtag_id) VALUES (?, ?)',
        [postId, hashtagRow.id]
      );
    }

    await conn.commit();

    const [[user]] = await pool.query(
      'SELECT id, username, display_name FROM users WHERE id = ?',
      [userId]
    );

    res.status(201).json({
      id: postId,
      content,
      likeCount: 0,
      likedByMe: false,
      createdAt: new Date().toISOString(),
      hashtags: tags,
      author: { id: user.id, username: user.username, displayName: user.display_name },
    });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

async function toggleLike(req, res, next) {
  const conn = await pool.getConnection();
  try {
    const postId = req.params.id;
    const userId = req.user.id;

    const [[post]] = await conn.query('SELECT id FROM posts WHERE id = ?', [postId]);
    if (!post) {
      conn.release();
      return res.status(404).json({ error: 'Post not found' });
    }

    const [existing] = await conn.query(
      'SELECT 1 FROM likes WHERE user_id = ? AND post_id = ?',
      [userId, postId]
    );

    await conn.beginTransaction();
    let liked;
    if (existing.length) {
      await conn.query('DELETE FROM likes WHERE user_id = ? AND post_id = ?', [userId, postId]);
      await conn.query('UPDATE posts SET like_count = like_count - 1 WHERE id = ?', [postId]);
      liked = false;
    } else {
      await conn.query('INSERT INTO likes (user_id, post_id) VALUES (?, ?)', [userId, postId]);
      await conn.query('UPDATE posts SET like_count = like_count + 1 WHERE id = ?', [postId]);
      liked = true;
    }
    await conn.commit();

    const [[row]] = await conn.query('SELECT like_count FROM posts WHERE id = ?', [postId]);
    res.json({ liked, likeCount: row.like_count });
  } catch (err) {
    await conn.rollback();
    next(err);
  } finally {
    conn.release();
  }
}

module.exports = { getFeed, createPost, toggleLike };
