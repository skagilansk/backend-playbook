const mongoose = require('mongoose');

const boardSchema = new mongoose.Schema({
  userId:      { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  title:       { type: String, default: 'Untitled Board' },
  formation:   { type: String, default: '4-3-3' },
  state:       { type: mongoose.Schema.Types.Mixed },  // full board snapshot
}, { timestamps: true });

module.exports = mongoose.model('Board', boardSchema);
