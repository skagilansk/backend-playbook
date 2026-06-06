const express = require('express');
const preseededSquads = require('../db/preseededSquads');

const router = express.Router();

function normalizeTeamName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

// ── GET /api/football/squad ──────────────────────────────────────────────────
router.get('/squad', async (req, res) => {
  const { teamName } = req.query;
  if (!teamName) return res.status(400).json({ error: 'teamName is required' });

  const normName = normalizeTeamName(teamName);

  if (preseededSquads[normName]) {
    const pre = preseededSquads[normName];
    console.log(`[Pre-Seeded Hit] Serving squad for "${teamName}" from offline preseeds`);
    return res.json({
      teamName: pre.teamName,
      formation: pre.formation,
      starters: pre.starters,
      subs: pre.subs,
      source: 'database'
    });
  }

  console.log(`[Squad Not Found] Team "${teamName}" (normalized: "${normName}") not found in preseeded dataset`);
  return res.status(404).json({ error: 'Team not found in preseeded dataset' });
});

// ── GET /api/football/matches ────────────────────────────────────────────────
router.get('/matches', async (req, res) => {
  const { teamName } = req.query;
  if (!teamName) return res.status(400).json({ error: 'teamName is required' });

  const normName = normalizeTeamName(teamName);

  if (preseededSquads[normName]) {
    console.log(`[Pre-Seeded Hit] Serving matches for "${teamName}" from offline preseeds`);
    return res.json(preseededSquads[normName].matches);
  }

  console.log(`[Matches Not Found] Matches for team "${teamName}" (normalized: "${normName}") not found in preseeded dataset`);
  return res.status(404).json({ error: 'Team not found in preseeded dataset' });
});

module.exports = router;
