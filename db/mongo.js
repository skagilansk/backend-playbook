/**
 * mongo.js — Mongoose connection manager
 *
 * Connects to MongoDB using MONGODB_URI from .env.
 * Exports `connectMongo()` to be called once at startup.
 * All models import mongoose directly; this file just ensures the
 * connection is established before routes try to use it.
 */
const path = require('path');
const fs = require('fs');
const localEnv = path.resolve(__dirname, '../.env');
const parentEnv = path.resolve(__dirname, '../../.env');
if (fs.existsSync(localEnv)) {
  require('dotenv').config({ path: localEnv });
} else {
  require('dotenv').config({ path: parentEnv });
}
const mongoose = require('mongoose');

let isConnected = false;

async function connectMongo() {
  const uri = process.env.MONGODB_URI;
  if (!uri) {
    console.warn('⚠️  MONGODB_URI not set – MongoDB features disabled');
    return false;
  }

  if (isConnected) return true;

  try {
    await mongoose.connect(uri, {
      serverSelectionTimeoutMS: 5000,
    });
    isConnected = true;
    console.log('✅  Connected to MongoDB');
    return true;
  } catch (err) {
    console.warn('⚠️  MongoDB connection failed:', err.message);
    return false;
  }
}

// Track connection state
mongoose.connection.on('disconnected', () => {
  isConnected = false;
  console.warn('⚠️  MongoDB disconnected');
});

mongoose.connection.on('reconnected', () => {
  isConnected = true;
  console.log('✅  MongoDB reconnected');
});

module.exports = { connectMongo, get isConnected() { return isConnected; } };
