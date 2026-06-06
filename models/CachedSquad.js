const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  number:       { type: Number },
  name:         { type: String },
  position:     { type: String }
}, { _id: false });

const matchSchema = new mongoose.Schema({
  date:        { type: String },
  home:        { type: String },
  away:        { type: String },
  score:       { type: String },
  result:      { type: String },
  competition: { type: String }
}, { _id: false });

const cachedSquadSchema = new mongoose.Schema({
  normalizedName: { type: String, unique: true, index: true },
  teamName:       { type: String, required: true },
  formation:      { type: String, default: '4-3-3' },
  starters:       [playerSchema],
  subs:           [playerSchema],
  matches:        [matchSchema],
  lastUpdated:    { type: Date, default: Date.now }
}, { timestamps: true });

module.exports = mongoose.model('CachedSquad', cachedSquadSchema);
