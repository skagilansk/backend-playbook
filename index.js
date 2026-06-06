const path = require('path');
const fs = require('fs');
const localEnv = path.resolve(__dirname, './.env');
const parentEnv = path.resolve(__dirname, '../.env');
if (fs.existsSync(localEnv)) {
  require('dotenv').config({ path: localEnv });
} else {
  require('dotenv').config({ path: parentEnv });
}

const express = require('express');
const http    = require('http');
const { Server } = require('socket.io');
const cors   = require('cors');

// ── MongoDB connection ──────────────────────────────────────────────────────
const { connectMongo } = require('./db/mongo');

// ── Route imports ──────────────────────────────────────────────────────────
const authRoutes      = require('./routes/auth');
const boardsRoutes    = require('./routes/boards');
const playsRoutes     = require('./routes/plays');
const squadsRoutes    = require('./routes/squads');
const matchesRoutes   = require('./routes/matches');
const gameplansRoutes = require('./routes/gameplans');
const footballRoutes  = require('./routes/football');

// ── Socket handler ─────────────────────────────────────────────────────────
const setupBoardSocket = require('./socket/boardSocket');

// ══════════════════════════════════════════════════════════════════════════
const app    = express();
const server = http.createServer(app);

// ── Middleware ─────────────────────────────────────────────────────────────
app.use(cors({
  origin: process.env.CLIENT_ORIGIN || '*',
  methods: ['GET','POST','PUT','DELETE','OPTIONS'],
  allowedHeaders: ['Content-Type','Authorization'],
}));
app.use(express.json({ limit: '2mb' }));

// ── REST API routes ────────────────────────────────────────────────────────
app.use('/api/auth',      authRoutes);
app.use('/api/boards',    boardsRoutes);
app.use('/api/plays',     playsRoutes);
app.use('/api/squads',    squadsRoutes);
app.use('/api/matches',   matchesRoutes);
app.use('/api/gameplans', gameplansRoutes);
app.use('/api/football',  footballRoutes);

// ─────────────────────────────────────────────────────────────────────────
//  AI Proxy endpoints
//  These keep secret API keys server-side and avoid browser CORS issues.
// ─────────────────────────────────────────────────────────────────────────

// ── Ollama proxy ───────────────────────────────────────────────────────────
app.post('/api/ollama', async (req, res) => {
  try {
    const response = await fetch('http://localhost:11434/api/chat', {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(req.body),
    });
    if (!response.ok)
      return res.status(response.status).json({ error: `Ollama error: ${response.status}` });
    const data = await response.json();
    res.json(data);
  } catch {
    res.status(503).json({ error: 'Ollama is not running. Start it with: ollama serve' });
  }
});

// ── Web Search Proxy (Free Search Grounding) ───────────────────────────────
app.post('/api/search', async (req, res) => {
  const { query } = req.body;
  if (!query) return res.status(400).json({ error: 'Query is required' });
  
  try {
    const { search } = require('duck-duck-scrape');
    const searchResults = await search(`${query} football match stats sofascore`);
    
    // Extract the textual snippets to use as AI context
    const contextStr = searchResults.results
      .slice(0, 5) // Top 5 results
      .map(r => `${r.title}: ${r.description}`)
      .join('\n\n');
      
    res.json({ context: contextStr });
  } catch (err) {
    console.error('Search error:', err);
    res.status(500).json({ error: 'Search failed', context: '' });
  }
});

// ── Perplexity proxy ───────────────────────────────────────────────────────
app.post('/api/perplexity', async (req, res) => {
  const apiKey = process.env.PERPLEXITY_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'PERPLEXITY_API_KEY not set in .env' });

  try {
    const response = await fetch('https://api.perplexity.ai/chat/completions', {
      method:  'POST',
      headers: {
        'Content-Type':  'application/json',
        'Authorization': `Bearer ${apiKey}`,
      },
      body: JSON.stringify(req.body),
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errBody.error?.message || `Perplexity error: ${response.status}`,
      });
    }
    res.json(await response.json());
  } catch (err) {
    res.status(503).json({ error: 'Could not reach Perplexity API: ' + err.message });
  }
});

// ── Gemini proxy ───────────────────────────────────────────────────────────
app.post('/api/gemini', async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey)
    return res.status(500).json({ error: 'GEMINI_API_KEY not set in .env' });

  const model = req.body.model || 'gemini-1.5-flash';
  const url   = `https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${apiKey}`;

  try {
    const response = await fetch(url, {
      method:  'POST',
      headers: { 'Content-Type': 'application/json' },
      body:    JSON.stringify(req.body.payload ?? req.body),
    });
    if (!response.ok) {
      const errBody = await response.json().catch(() => ({}));
      return res.status(response.status).json({
        error: errBody.error?.message || `Gemini error: ${response.status}`,
      });
    }
    res.json(await response.json());
  } catch (err) {
    res.status(503).json({ error: 'Could not reach Gemini API: ' + err.message });
  }
});

// ── Health check ───────────────────────────────────────────────────────────
app.get('/health', (_req, res) => {
  const mongoose = require('mongoose');
  res.json({
    status:    'ok',
    timestamp: new Date().toISOString(),
    env:       process.env.NODE_ENV || 'development',
    mongo:     mongoose.connection.readyState === 1 ? 'connected' : 'disconnected',
  });
});

// ── 404 catch-all ──────────────────────────────────────────────────────────
app.use((_req, res) => res.status(404).json({ error: 'Not found' }));

// ── Global error handler ───────────────────────────────────────────────────
// eslint-disable-next-line no-unused-vars
app.use((err, _req, res, _next) => {
  console.error('Unhandled error:', err.message);
  res.status(500).json({ error: 'Internal server error' });
});

// ── Socket.io ──────────────────────────────────────────────────────────────
const io = new Server(server, {
  cors: { origin: '*', methods: ['GET','POST'] },
});
setupBoardSocket(io);

// ── Start ──────────────────────────────────────────────────────────────────
const PORT = process.env.PORT || 5000;

(async () => {
  await connectMongo();   // connect to MongoDB before accepting requests

  server.listen(PORT, () => {
    console.log(`\n🟢  Playbook Live server  →  http://localhost:${PORT}`);
    console.log(`    Health: http://localhost:${PORT}/health\n`);
  });
})();
