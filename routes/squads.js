/**
 * /api/squads  — Squad management using MongoDB/Mongoose
 */
const express = require('express');
const Squad   = require('../models/Squad');
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

// GET /api/squads
router.get('/', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const squads = await Squad.find({ userId: req.user.userId })
      .sort({ updatedAt: -1 })
      .lean();
    res.json(squads.map(s => ({ ...s, player_count: (s.players || []).length })));
  } catch (err) {
    console.error('GET /api/squads error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// GET /api/squads/:id
router.get('/:id', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const squad = await Squad.findOne({ _id: req.params.id, userId: req.user.userId }).lean();
    if (!squad) return res.status(404).json({ error: 'Squad not found' });
    res.json(squad);
  } catch (err) {
    console.error('GET /api/squads/:id error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// POST /api/squads
router.post('/', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const { name = 'Main Squad', formation = '4-3-3', players = [] } = req.body;
    const squad = await Squad.create({ userId: req.user.userId, name, formation, players });
    res.status(201).json(squad);
  } catch (err) {
    console.error('POST /api/squads error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// PUT /api/squads/:id
router.put('/:id', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const { name, formation, players } = req.body;
    const update = {};
    if (name      !== undefined) update.name      = name;
    if (formation !== undefined) update.formation = formation;
    if (players   !== undefined) update.players   = players;

    const squad = await Squad.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: update },
      { new: true, runValidators: true }
    ).lean();

    if (!squad) return res.status(404).json({ error: 'Squad not found' });
    res.json(squad);
  } catch (err) {
    console.error('PUT /api/squads/:id error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

// DELETE /api/squads/:id
router.delete('/:id', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const result = await Squad.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!result) return res.status(404).json({ error: 'Squad not found' });
    res.json({ message: 'Squad deleted' });
  } catch (err) {
    console.error('DELETE /api/squads/:id error:', err.message);
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
