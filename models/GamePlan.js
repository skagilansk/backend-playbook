const mongoose = require('mongoose');

const playerPositionSchema = new mongoose.Schema({
  number:   { type: Number },
  name:     { type: String },
  position: { type: String },
  x:        { type: Number },
  y:        { type: Number },
  role:     { type: String, default: null },
  isSub:    { type: Boolean, default: false },
}, { _id: false });

const gamePlanSchema = new mongoose.Schema({
  userId:       { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },

  // Identity
  title:        { type: String, default: 'Game Plan' },
  opponent:     { type: String, default: '' },
  matchDate:    { type: String, default: null },
  venue:        { type: String, default: null },
  competition:  { type: String, default: null },

  // Tactical setup
  formation:    { type: String, default: '4-3-3' },
  style:        { type: String, default: 'Balanced' }, // Pressing | Counter | Possession | etc.
  players:      [playerPositionSchema],

  // AI-generated content
  aiSummary:    { type: String, default: '' },         // Short executive summary
  keyInstructions: [{ type: String }],                  // Bullet list of tactical instructions
  pressingTriggers: [{ type: String }],                 // When/where to press
  setPieceFocus:    { type: String, default: '' },      // Set-piece notes
  defensiveShape:   { type: String, default: '' },      // Defensive block notes
  attackingPhase:   { type: String, default: '' },      // Build-up / attacking notes
  keyPlayers:       [{ name: String, instruction: String }], // Key player roles

  // Meta
  isActive:     { type: Boolean, default: false },      // Current "active" game plan
  tags:         [{ type: String }],
  notes:        { type: String, default: '' },
}, { timestamps: true });

module.exports = mongoose.model('GamePlan', gamePlanSchema);
