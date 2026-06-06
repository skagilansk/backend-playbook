/**
 * /api/plays  — Plays/animations using MongoDB/Mongoose
 * Plays are stored embedded in Board documents.
 */
const express = require('express');
const Board   = require('../models/Board');
const auth    = require('../middleware/authMiddleware');
const { isConnected } = require('../db/mongo');

const router = express.Router();

function dbCheck(res) {
  if (!isConnected) { res.status(503).json({ error: 'Database not available' }); return false; }
  return true;
}

// GET /api/plays?boardId=xxx
router.get('/', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const board = await Board.findOne({ _id: req.query.boardId, userId: req.user.userId }).lean();
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json((board.state?.plays) || []);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/plays
router.post('/', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const { boardId, title, initialState, animationSteps } = req.body;
    if (!boardId || !title) return res.status(400).json({ error: 'boardId and title required' });
    const play = { id: Date.now().toString(), title, initialState, animationSteps, createdAt: new Date() };
    await Board.findOneAndUpdate(
      { _id: boardId, userId: req.user.userId },
      { $push: { 'state.plays': play } }
    );
    res.status(201).json(play);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
