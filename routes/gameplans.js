/**
 * /api/gameplans — AI-powered Game Plan management
 * Now with: live opponent scouting, match trends, stock plans, scenarios
 */
const express  = require('express');
const GamePlan = require('../models/GamePlan');
const auth     = require('../middleware/authMiddleware');
const db       = require('../db/mongo');

const router = express.Router();

function dbCheck(res) {
  if (!db.isConnected) { res.status(503).json({ error: 'Database not available' }); return false; }
  return true;
}

// ── Helpers ─────────────────────────────────────────────────────────────────

async function callGemini(apiKey, prompt, temperature = 0.85) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature, maxOutputTokens: 6000 },
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini error ${response.status}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

async function callPerplexity(apiKey, query) {
  const response = await fetch('https://api.perplexity.ai/chat/completions', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${apiKey}`,
    },
    body: JSON.stringify({
      model: 'llama-3.1-sonar-large-128k-online',
      messages: [
        {
          role: 'system',
          content: 'You are a football analyst. Return ONLY JSON data, no markdown, no explanation.',
        },
        { role: 'user', content: query },
      ],
      max_tokens: 2000,
      temperature: 0.2,
      return_citations: false,
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Perplexity error ${response.status}`);
  }
  const data = await response.json();
  return data.choices?.[0]?.message?.content || '';
}

function parseJsonSafe(raw) {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    return null;
  }
}

// ── GET /api/gameplans ──────────────────────────────────────────────────────
router.get('/', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const plans = await GamePlan.find({ userId: req.user.userId })
      .sort({ isActive: -1, updatedAt: -1 }).lean();
    res.json(plans);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── GET /api/gameplans/:id ──────────────────────────────────────────────────
router.get('/:id', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const plan = await GamePlan.findOne({ _id: req.params.id, userId: req.user.userId }).lean();
    if (!plan) return res.status(404).json({ error: 'Game plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── POST /api/gameplans/scout — Live opponent data fetch via Perplexity ─────
router.post('/scout', auth, async (req, res) => {
  const pplxKey = process.env.PERPLEXITY_API_KEY;
  const gemKey  = process.env.GEMINI_API_KEY;

  const { opponent, competition = 'league', ourTeamName = 'Our Team' } = req.body;
  if (!opponent) return res.status(400).json({ error: 'opponent is required' });

  const scoutData = {
    opponent,
    fetchedAt: new Date().toISOString(),
    lastFiveMatches: [],
    currentFormation: '',
    keyPlayers: [],
    strengths: [],
    weaknesses: [],
    headToHead: [],
    avgGoalsScored: null,
    avgGoalsConceded: null,
    pressureStats: '',
    source: 'ai-generated',
  };

  // Try to search TheSportsDB for opponent team and apply RAG
  let dbPlayers = [];
  let dbMatches = [];
  let dbTeamName = opponent;
  let useRAG = false;

  try {
    const searchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(opponent)}`;
    const searchRes = await fetch(searchUrl);
    if (searchRes.ok) {
      const searchData = await searchRes.json();
      if (searchData.teams && searchData.teams.length > 0) {
        const team = searchData.teams[0];
        dbTeamName = team.strTeam;
        const teamId = team.idTeam;

        // Fetch players
        const playersUrl = `https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${teamId}`;
        const playersRes = await fetch(playersUrl);
        if (playersRes.ok) {
          const playersData = await playersRes.json();
          if (playersData.player && playersData.player.length > 0) {
            dbPlayers = playersData.player
              .map(p => ({
                name: p.strPlayer,
                position: p.strPosition,
              }))
              .filter(p => p.position && !p.position.toLowerCase().includes('coach') && !p.position.toLowerCase().includes('manager'));
          }
        }

        // Fetch recent matches
        const matchesUrl = `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`;
        const matchesRes = await fetch(matchesUrl);
        if (matchesRes.ok) {
          const matchesData = await matchesRes.json();
          if (matchesData.results && matchesData.results.length > 0) {
            dbMatches = matchesData.results.map(m => {
              const homeScore = parseInt(m.intHomeScore, 10);
              const awayScore = parseInt(m.intAwayScore, 10);
              let result = 'D';
              const isHome = m.idHomeTeam === teamId || m.strHomeTeam.toLowerCase().includes(opponent.toLowerCase());
              if (isHome) {
                if (homeScore > awayScore) result = 'W';
                else if (homeScore < awayScore) result = 'L';
              } else {
                if (awayScore > homeScore) result = 'W';
                else if (awayScore < homeScore) result = 'L';
              }
              return {
                date: m.dateEvent,
                home: m.strHomeTeam,
                away: m.strAwayTeam,
                score: `${m.intHomeScore}-${m.intAwayScore}`,
                result,
                competition: m.strLeague || 'League'
              };
            });
          }
        }

        if (dbPlayers.length > 0 || dbMatches.length > 0) {
          useRAG = true;
        }
      }
    }
  } catch (err) {
    console.warn('TheSportsDB query for scout opponent failed, using normal AI fallback:', err.message);
  }

  // 1. If we have real DB data, call Gemini using RAG
  if (useRAG && gemKey) {
    try {
      const prompt = `You are a professional tactical analyst. Generate a detailed scouting report for ${dbTeamName} in ${competition} this season.
We have retrieved their actual roster and recent match results from a sports database.

Retrieved Squad Members:
${dbPlayers.slice(0, 20).map(p => `- ${p.name} (${p.position})`).join('\n')}

Retrieved Recent Matches:
${dbMatches.slice(0, 5).map(m => `- ${m.date}: ${m.home} ${m.score} ${m.away} (${m.result})`).join('\n')}

Based on this real squad list and recent matches, pick their likely starting formation (e.g. 4-3-3, 4-2-3-1, 3-5-2), identify the top 3 key players (specifically choosing from the retrieved squad members above) and describe their tactical trait, identify 3 tactical strengths and 3 weaknesses, and estimate recent head-to-head record vs ${ourTeamName}.
Return ONLY JSON with this format:
{
  "lastFiveMatches": [
    {"date": "2026-05-18", "home": "Arsenal", "away": "Burnley", "score": "1-0", "competition": "Premier League", "result": "W"}
  ],
  "currentFormation": "4-3-3",
  "keyPlayers": [
    {"name": "Player Name", "position": "Position", "trait": "Trait description"}
  ],
  "strengths": ["Strength 1", "Strength 2", "Strength 3"],
  "weaknesses": ["Weakness 1", "Weakness 2", "Weakness 3"],
  "headToHead": [
    {"date": "2025-11-20", "home": "${ourTeamName}", "away": "${dbTeamName}", "score": "2-1"}
  ],
  "avgGoalsScored": 1.8,
  "avgGoalsConceded": 0.9,
  "pressureStats": "High-intensity counter press"
}
Make sure all key players are selected from the retrieved squad members list. Return ONLY valid JSON, no markdown code fences, no extra text.`;

      const raw = await callGemini(gemKey, prompt, 0.5);
      const parsed = parseJsonSafe(raw);
      if (parsed) {
        Object.assign(scoutData, parsed, { opponent: dbTeamName, source: 'database-rag' });
        return res.json(scoutData);
      }
    } catch (err) {
      console.warn('RAG scouting failed, falling back to Perplexity/standard Gemini:', err.message);
    }
  }

  // 2. Try Perplexity for real data first if RAG wasn't used or failed
  if (pplxKey && scoutData.source === 'ai-generated') {
    try {
      const query = `Give me the last 5 matches, current formation, top 3 key players, 3 tactical strengths, and 3 weaknesses for ${opponent} in ${competition} this season. Also include recent head-to-head record vs ${ourTeamName}. Return as JSON with fields: lastFiveMatches (array of {date,home,away,score,competition,result}), currentFormation (string), keyPlayers (array of {name,position,trait}), strengths (array of strings), weaknesses (array of strings), headToHead (array of {date,home,away,score}), avgGoalsScored (number), avgGoalsConceded (number).`;

      const raw = await callPerplexity(pplxKey, query);
      const parsed = parseJsonSafe(raw);
      if (parsed) {
        Object.assign(scoutData, parsed, { source: 'perplexity-live' });
      }
    } catch (err) {
      console.warn('Perplexity scout failed, falling back to Gemini:', err.message);
    }
  }

  // 3. Fall back to Gemini if Perplexity/RAG both failed or were unavailable
  if (scoutData.source === 'ai-generated' && gemKey) {
    try {
      const prompt = `You are a football scout database. Generate realistic scouting data for ${opponent} in ${competition} this season. Include plausible form, stats, and tactical profile. Return ONLY JSON with: lastFiveMatches (array of {date,home,away,score,competition,result}), currentFormation (string), keyPlayers (array of {name,position,trait}), strengths (array of 3 strings), weaknesses (array of 3 strings), headToHead (array of 2 recent {date,home,away,score}), avgGoalsScored (number 0-3), avgGoalsConceded (number 0-3), pressureStats (string describing their pressing intensity).`;
      const raw = await callGemini(gemKey, prompt, 0.6);
      const parsed = parseJsonSafe(raw);
      if (parsed) {
        Object.assign(scoutData, parsed, { source: 'gemini-generated' });
      }
    } catch (err) {
      console.warn('Gemini scout also failed:', err.message);
    }
  }

  res.json(scoutData);
});

// ── POST /api/gameplans/generate — Generate N AI game plans ─────────────────
router.post('/generate', auth, async (req, res) => {
  const apiKey = process.env.GEMINI_API_KEY;
  if (!apiKey) return res.status(500).json({ error: 'GEMINI_API_KEY not set in .env' });

  const {
    opponent        = 'Unknown Opponent',
    ourTeamName     = 'Our Team',
    formation       = '4-3-3',
    players         = [],
    matchDate       = null,
    venue           = null,
    competition     = null,
    opponentStyle   = '',
    count           = 3,
    saveToDb        = true,
    // Enhanced inputs
    scoutData       = null,   // from /scout endpoint
    ourRecentForm   = [],     // our last 5 results
    headToHead      = [],     // h2h record
    ourStrengths    = [],
    ourWeaknesses   = [],
  } = req.body;

  const playerList = players.length > 0
    ? players.slice(0, 11).map((p, i) => `  ${i + 1}. ${p.name || `P${i+1}`} (${p.position || 'CM'})`).join('\n')
    : '  (No players provided — generate generic positions)';

  const opponentInfo = scoutData ? `
Opponent Scouting Report for ${opponent}:
- Formation: ${scoutData.currentFormation || 'Unknown'}
- Key Players: ${(scoutData.keyPlayers || []).map(p => `${p.name} (${p.position}) — ${p.trait}`).join(', ') || 'Unknown'}
- Strengths: ${(scoutData.strengths || []).join(', ') || 'Unknown'}
- Weaknesses: ${(scoutData.weaknesses || []).join(', ') || 'Unknown'}
- Avg Goals Scored: ${scoutData.avgGoalsScored ?? 'N/A'}
- Avg Goals Conceded: ${scoutData.avgGoalsConceded ?? 'N/A'}
- Their pressing style: ${scoutData.pressureStats || opponentStyle || 'Unknown'}
- Recent form: ${(scoutData.lastFiveMatches || []).slice(0, 5).map(m => `${m.home} ${m.score} ${m.away} (${m.result})`).join(', ') || 'Unknown'}
` : `Opponent style/system: ${opponentStyle || 'Unknown'}`;

  const formInfo = ourRecentForm.length > 0
    ? `Our recent form (last ${ourRecentForm.length}): ${ourRecentForm.map(m => `${m.home} ${m.score} ${m.away} (${m.result})`).join(', ')}`
    : 'Our recent form: not provided';

  const h2hInfo = headToHead.length > 0
    ? `Head-to-head: ${headToHead.slice(0, 3).map(m => `${m.home} ${m.score} ${m.away}`).join(', ')}`
    : '';

  const prompt = `You are an elite football (soccer) tactical director and analyst.

Match Context:
- Our Team: ${ourTeamName}
- Our Formation: ${formation}
- Opponent: ${opponent}
- Match Date: ${matchDate || 'TBD'}
- Venue: ${venue || 'Unknown'}
- Competition: ${competition || 'Friendly'}
${formInfo}
${h2hInfo}

Our Squad (Starting XI):
${playerList}

${opponentInfo}

TASK: Generate EXACTLY ${count} DISTINCT tactical game plans. Each must have a completely different tactical approach (e.g., press, counter, possession, high-line, direct, wing-play).

IMPROVISATION RULES:
1. Contextual Awareness: Specifically adjust tactics based on "Our recent form". If momentum is low, favor stability; if high, favor dominance.
2. Opponent Exploitation: Explicitly target the "Weaknesses" identified in the scouting report.
3. Creative Rotations: Suggest specific "Key Player" role assignments that might surprise the opponent (e.g., an inverted winger becoming a second striker, or a ball-winning mid dropping into a back 3).
4. Scenario Thinking: Each plan should feel like a distinct "scenario" for the upcoming match.

Return a JSON array of exactly ${count} objects. Each MUST have ALL these fields:
{
  "title": "catchy, specific tactical plan name (not generic)",
  "style": "one of: Pressing | Counter-Attack | Possession | High-Line | Low-Block | Wing-Play | Tiki-Taka | Direct | Balanced",
  "formation": "formation string (can adapt from ${formation})",
  "aiSummary": "3-4 sentence executive summary explaining the logic behind this plan vs THIS specific opponent",
  "keyInstructions": ["4-6 highly specific tactical instructions"],
  "pressingTriggers": ["2-3 specific press triggers vs this opponent"],
  "setPieceFocus": "specific set piece strategy",
  "defensiveShape": "how to defend vs this opponent's specific threats",
  "attackingPhase": "specific attacking approach to exploit their weaknesses",
  "keyPlayers": [{"name": "player name from squad", "instruction": "specific instruction"}],
  "tags": ["2-4 descriptor tags"]
}

Return ONLY the raw JSON array. No markdown, no explanation, no code fences.`;

  try {
    const raw = await callGemini(apiKey, prompt);
    let plans = parseJsonSafe(raw);

    if (!Array.isArray(plans)) {
      return res.status(500).json({ error: 'AI returned invalid JSON', raw });
    }

    let savedPlans = plans;
    if (saveToDb && isConnected) {
      const docs = plans.map(p => ({
        ...p,
        userId: req.user.userId,
        opponent, matchDate, venue, competition,
        players, formation: p.formation || formation,
        scoutData,
      }));
      savedPlans = await GamePlan.insertMany(docs);
    }

    res.json({ plans: savedPlans, count: savedPlans.length });
  } catch (err) {
    console.error('generate error:', err.message);
    res.status(503).json({ error: 'Could not generate plans: ' + err.message });
  }
});

// ── POST /api/gameplans (save) ──────────────────────────────────────────────
router.post('/', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const plan = await GamePlan.create({ ...req.body, userId: req.user.userId });
    res.status(201).json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/gameplans/:id ──────────────────────────────────────────────────
router.put('/:id', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const plan = await GamePlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: req.body },
      { new: true }
    ).lean();
    if (!plan) return res.status(404).json({ error: 'Game plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── PUT /api/gameplans/:id/activate ────────────────────────────────────────
router.put('/:id/activate', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    await GamePlan.updateMany({ userId: req.user.userId }, { $set: { isActive: false } });
    const plan = await GamePlan.findOneAndUpdate(
      { _id: req.params.id, userId: req.user.userId },
      { $set: { isActive: true } },
      { new: true }
    ).lean();
    if (!plan) return res.status(404).json({ error: 'Game plan not found' });
    res.json(plan);
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

// ── DELETE /api/gameplans/:id ───────────────────────────────────────────────
router.delete('/:id', auth, async (req, res) => {
  if (!dbCheck(res)) return;
  try {
    const result = await GamePlan.findOneAndDelete({ _id: req.params.id, userId: req.user.userId });
    if (!result) return res.status(404).json({ error: 'Game plan not found' });
    res.json({ message: 'Game plan deleted' });
  } catch (err) {
    res.status(500).json({ error: 'Server error' });
  }
});

module.exports = router;
