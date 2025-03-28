const express = require('express');
const { verifyToken } = require('../middleware/auth');
const db = require('../config/db');

const router = express.Router();

router.get('/user-count', verifyToken, async (req, res) => {
  try {
    const result = await db.query('SELECT count(*) as cnt FROM users');
    res.json({ success: true, count: parseInt(result.rows[0].cnt) });
  } catch (error) {
    console.error('Query failed:', error.message);
    res.status(500).json({ error: 'Database query failed' });
  }
});

module.exports = router;