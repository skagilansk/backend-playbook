/**
 * /api/boards  — Board management using MongoDB/Mongoose
 */
const express = require('express');
const Board   = require('../models/Board');
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

// GET /api/boards
router.get('/', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const boards = await Board.find({ userId: req.user.userId }).sort({ updatedAt: -1 }).lean();
    res.json(boards);
  } catch (err) {
    console.error('GET /api/boards error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/boards
router.post('/', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const { title, formation, state } = req.body;
    if (!title) return res.status(400).json({ error: 'Title is required' });
    const board = await Board.create({ userId: req.user.userId, title, formation, state });
    res.status(201).json(board);
  } catch (err) {
    console.error('POST /api/boards error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/boards/:id
router.get('/:id', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const board = await Board.findOne({ _id: req.params.id, userId: req.user.userId }).lean();
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board);
  } catch (err) {
    console.error('GET /api/boards/:id error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/boards/:id
router.put('/:id', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const board = await Board.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: req.body },
      { new: true }
    ).lean();
    if (!board) return res.status(404).json({ error: 'Board not found' });
    res.json(board);
  } catch (err) {
    console.error('PUT /api/boards/:id error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
