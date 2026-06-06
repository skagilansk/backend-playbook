/**
 * /api/matches  — Match analysis persistence using MongoDB/Mongoose
 */
const express = require('express');
const Match   = require('../models/Match');
const auth    = require('../middleware/authMiddleware');
const db      = require('../db/mongo');

const router = express.Router();

function dbCheck(res) {
  if (!db.isConnected) {
    res.status(503).json({ error: 'Database not available' });
    return false;
  }
  return true;
}

// GET /api/matches
router.get('/', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const { limit = 20, offset = 0 } = req.query;
    const matches = await Match.find({ userId: req.user.userId })
      .sort({ createdAt: -1 })
      .skip(Number(offset))
      .limit(Math.min(Number(limit), 100))
      .select('query matchDate stadium matchScore homeTeam awayTeam createdAt')
      .lean();
    res.json(matches.map(m => ({
      ...m,
      home_name: m.homeTeam?.name,
      away_name: m.awayTeam?.name,
    })));
  } catch (err) {
    console.error('GET /api/matches error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/matches/:id
router.get('/:id', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const match = await Match.findOne({ _id: req.params.id, userId: req.user.userId }).lean();
    if (!match) return res.status(404).json({ error: 'Match not found' });
    res.json(match);
  } catch (err) {
    console.error('GET /api/matches/:id error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/matches
router.post('/', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const { query, matchDate, stadium, matchScore, homeTeam, awayTeam, keyMoments = [] } = req.body;
    if (!query || !homeTeam || !awayTeam)
      return res.status(400).json({ error: 'query, homeTeam and awayTeam are required' });

    // Build playerRatings from home + away players
    const playerRatings = [
      ...(homeTeam.players || []).map(p => ({ ...p, side: 'home', teamName: homeTeam.name })),
      ...(awayTeam.players || []).map(p => ({ ...p, side: 'away', teamName: awayTeam.name })),
    ];

    const match = await Match.create({
      userId: req.user.userId,
      query, matchDate, stadium, matchScore,
      homeTeam, awayTeam,
      keyMoments,
      playerRatings,
      rawResponse: req.body,
    });
    res.status(201).json(match);
  } catch (err) {
    console.error('POST /api/matches error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/matches/:id
router.delete('/:id', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const result = await Match.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!result) return res.status(404).json({ error: 'Match not found' });
    res.json({ message: 'Match analysis deleted' });
  } catch (err) {
    console.error('DELETE /api/matches/:id error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
