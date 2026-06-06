const mongoose = require('mongoose');

const playerSchema = new mongoose.Schema({
  number:       { type: Number, default: 1 },
  name:         { type: String, default: 'Player' },
  position:     { type: String, default: 'CM' },
  role:         { type: String, default: null },
  roleNote:     { type: String, default: null },
  isSub:        { type: Boolean, default: false },
  x:            { type: Number, default: 50 },
  y:            { type: Number, default: 50 },
}, { _id: false });

const squadSchema = new mongoose.Schema({
  userId:    { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  name:      { type: String, default: 'Main Squad' },
  formation: { type: String, default: '4-3-3' },
  players:   [playerSchema],
}, { timestamps: true });

module.exports = mongoose.model('Squad', squadSchema);
