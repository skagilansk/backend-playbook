const mongoose = require('mongoose');

const keyMomentSchema = new mongoose.Schema({
  minute:      { type: Number, default: 0 },
  description: { type: String, default: '' },
  team:        { type: String, default: null },
}, { _id: false });

const playerRatingSchema = new mongoose.Schema({
  name:          { type: String },
  position:      { type: String },
  teamName:      { type: String },
  side:          { type: String, enum: ['home', 'away'] },
  rating:        { type: Number, default: 6.0 },
  minutesPlayed: { type: Number, default: null },
}, { _id: false });

const matchSchema = new mongoose.Schema({
  userId:        { type: mongoose.Schema.Types.ObjectId, ref: 'User', required: true },
  query:         { type: String, required: true },
  matchDate:     { type: String, default: null },
  stadium:       { type: String, default: null },
  matchScore:    { type: String, default: null },
  homeTeam:      { type: mongoose.Schema.Types.Mixed },
  awayTeam:      { type: mongoose.Schema.Types.Mixed },
  keyMoments:    [keyMomentSchema],
  playerRatings: [playerRatingSchema],
  rawResponse:   { type: mongoose.Schema.Types.Mixed },
}, { timestamps: true });

module.exports = mongoose.model('Match', matchSchema);
