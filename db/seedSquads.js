const mongoose = require('mongoose');
const { search } = require('duck-duck-scrape');
require('dotenv').config({ path: '../.env' });

const CachedSquad = require('../models/CachedSquad');

const TEAMS_LIST = [
  // Premier League
  { name: 'Arsenal', domain: 'arsenal.com' },
  { name: 'Aston Villa', domain: 'avfc.co.uk' },
  { name: 'Bournemouth', domain: 'afcb.co.uk' },
  { name: 'Brentford', domain: 'brentfordfc.com' },
  { name: 'Brighton & Hove Albion', domain: 'brightonandhovealbion.com' },
  { name: 'Burnley', domain: 'burnleyfootballclub.com' },
  { name: 'Chelsea', domain: 'chelseafc.com' },
  { name: 'Crystal Palace', domain: 'cpfc.co.uk' },
  { name: 'Everton', domain: 'evertonfc.com' },
  { name: 'Fulham', domain: 'fulhamfc.com' },
  { name: 'Leeds United', domain: 'leedsunited.com' },
  { name: 'Liverpool', domain: 'liverpoolfc.com' },
  { name: 'Manchester City', domain: 'mancity.com' },
  { name: 'Manchester United', domain: 'manutd.com' },
  { name: 'Newcastle United', domain: 'nufc.co.uk' },
  { name: 'Nottingham Forest', domain: 'nottinghamforest.co.uk' },
  { name: 'Sunderland', domain: 'safc.com' },
  { name: 'Tottenham Hotspur', domain: 'tottenhamhotspur.com' },
  { name: 'West Ham United', domain: 'whufc.com' },
  { name: 'Wolverhampton Wanderers', domain: 'wolves.co.uk' },

  // La Liga
  { name: 'Alaves', domain: 'deportivoalaves.com' },
  { name: 'Athletic Club', domain: 'athletic-club.eus' },
  { name: 'Atletico Madrid', domain: 'atleticodemadrid.com' },
  { name: 'Barcelona', domain: 'fcbarcelona.com' },
  { name: 'Celta Vigo', domain: 'rccelta.es' },
  { name: 'Elche', domain: 'elchecf.es' },
  { name: 'Espanyol', domain: 'rcdespanyol.com' },
  { name: 'Getafe', domain: 'getafecf.com' },
  { name: 'Girona', domain: 'gironafc.cat' },
  { name: 'Levante', domain: 'levanteud.com' },
  { name: 'Mallorca', domain: 'rcdmallorca.es' },
  { name: 'Osasuna', domain: 'osasuna.es' },
  { name: 'Rayo Vallecano', domain: 'rayovallecano.es' },
  { name: 'Real Betis', domain: 'realbetisbalompie.es' },
  { name: 'Real Madrid', domain: 'realmadrid.com' },
  { name: 'Real Oviedo', domain: 'realoviedo.es' },
  { name: 'Real Sociedad', domain: 'realsociedad.eus' },
  { name: 'Sevilla', domain: 'sevillafc.es' },
  { name: 'Valencia', domain: 'valenciacf.com' },
  { name: 'Villarreal', domain: 'villarrealcf.es' }
];

function normalizeTeamName(name) {
  if (!name) return '';
  return name.toLowerCase().replace(/[^a-z0-9]/g, '');
}

const sleep = (ms) => new Promise(resolve => setTimeout(resolve, ms));

function mapPosition(pos) {
  if (!pos) return 'CM';
  const p = pos.toLowerCase();
  if (p.includes('goalkeeper')) return 'GK';
  if (p.includes('centre-back') || p.includes('center-back') || p.includes('central defender')) return 'CB';
  if (p.includes('left-back') || p.includes('left back') || p.includes('left wing-back')) return 'LB';
  if (p.includes('right-back') || p.includes('right back') || p.includes('right wing-back')) return 'RB';
  if (p.includes('defensive midfield')) return 'CDM';
  if (p.includes('attacking midfield')) return 'CAM';
  if (p.includes('midfield') || p.includes('central midfield')) return 'CM';
  if (p.includes('left winger') || p.includes('left wing') || p.includes('left midfield')) return 'LW';
  if (p.includes('right winger') || p.includes('right wing') || p.includes('right midfield')) return 'RW';
  if (p.includes('centre-forward') || p.includes('striker') || p.includes('forward') || p.includes('second striker')) return 'ST';
  return 'CM';
}

async function callGemini(apiKey, prompt) {
  const url = `https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${apiKey}`;
  const response = await fetch(url, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      contents: [{ parts: [{ text: prompt }] }],
      generationConfig: { temperature: 0.1, maxOutputTokens: 2048 },
    }),
  });
  if (!response.ok) {
    const err = await response.json().catch(() => ({}));
    throw new Error(err.error?.message || `Gemini error ${response.status}`);
  }
  const data = await response.json();
  return data.candidates?.[0]?.content?.parts?.[0]?.text || '';
}

function parseJsonSafe(raw) {
  try {
    const cleaned = raw.replace(/```json\n?/g, '').replace(/```\n?/g, '').trim();
    return JSON.parse(cleaned);
  } catch {
    const match = raw.match(/[\[{][\s\S]*[\]}]/);
    if (match) {
      try {
        return JSON.parse(match[0]);
      } catch {
        return null;
      }
    }
    return null;
  }
}

// 1. Web Search Grounding on official site (Tier 1/2)
async function fetchSquadAndMatchesFromWebSearch(teamName, domain, apiKey) {
  const squadQuery = `${teamName} first team squad players roster site:${domain}`;
  const squadSearch = await search(squadQuery);
  if (!squadSearch.results || squadSearch.results.length === 0) {
    throw new Error(`No squad search results found on domain ${domain}`);
  }
  const squadContext = squadSearch.results
    .slice(0, 5)
    .map(r => `Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description}`)
    .join('\n\n');

  const matchesQuery = `${teamName} last 5 matches results scores site:${domain} || score`;
  const matchesSearch = await search(matchesQuery);
  const matchesContext = (matchesSearch.results || [])
    .slice(0, 5)
    .map(r => `Title: ${r.title}\nURL: ${r.url}\nDescription: ${r.description}`)
    .join('\n\n');

  const prompt = `You are a football database crawler. I have searched the web for official team details of "${teamName}".

Squad Web Context:
${squadContext}

Matches Web Context:
${matchesContext}

Extract:
1. Starting XI and 5 substitute players from the official squad list. Assign correct name, jersey number, and position (GK/CB/LB/RB/CDM/CM/CAM/LW/RW/ST).
2. Last 5 match results (date, home, away, score, result "W"/"D"/"L", and competition).

Return ONLY a valid JSON object in this format (no markdown code fences, no extra text):
{
  "starters": [
    {"number": 1, "name": "Player Name", "position": "GK"}
  ],
  "subs": [
    {"number": 12, "name": "Sub Name", "position": "CM"}
  ],
  "matches": [
    {"date": "18 May 2026", "home": "${teamName}", "away": "Chelsea", "score": "2-1", "result": "W", "competition": "Premier League"}
  ]
}
Return ONLY JSON.`;

  const raw = await callGemini(apiKey, prompt);
  const parsed = parseJsonSafe(raw);
  if (!parsed || !parsed.starters) {
    throw new Error('Failed to parse scraped squad and matches data from web search');
  }
  return parsed;
}

// 2. TheSportsDB Fallback (Tier 3)
async function fetchSquadAndMatchesFromSportsDB(teamName) {
  console.log(`   🔍 [TheSportsDB] Fetching squad and matches for ${teamName}...`);
  const teamSearchUrl = `https://www.thesportsdb.com/api/v1/json/3/searchteams.php?t=${encodeURIComponent(teamName)}`;
  const teamSearchRes = await fetch(teamSearchUrl);
  if (!teamSearchRes.ok) throw new Error(`TheSportsDB search failed: ${teamSearchRes.status}`);
  const teamSearchData = await teamSearchRes.json();

  if (!teamSearchData.teams || teamSearchData.teams.length === 0) {
    throw new Error(`Team ${teamName} not found in TheSportsDB`);
  }

  const team = teamSearchData.teams[0];
  const teamId = team.idTeam;

  const matchesUrl = `https://www.thesportsdb.com/api/v1/json/3/eventslast.php?id=${teamId}`;
  const matchesRes = await fetch(matchesUrl);
  const matchesData = await matchesRes.json();
  let matches = [];
  if (matchesData.results && matchesData.results.length > 0) {
    matches = matchesData.results.map(m => {
      const homeScore = parseInt(m.intHomeScore, 10);
      const awayScore = parseInt(m.intAwayScore, 10);
      let result = 'D';
      const isHome = m.idHomeTeam === teamId || m.strHomeTeam.toLowerCase().includes(teamName.toLowerCase());
      if (isHome) {
        if (homeScore > awayScore) result = 'W';
        else if (homeScore < awayScore) result = 'L';
      } else {
        if (awayScore > homeScore) result = 'W';
        else if (awayScore < homeScore) result = 'L';
      }
      return {
        date: m.dateEvent || 'Recent',
        home: m.strHomeTeam,
        away: m.strAwayTeam,
        score: `${m.intHomeScore}-${m.intAwayScore}`,
        result,
        competition: m.strLeague || 'League'
      };
    });
  } else {
    matches = generateMatchesLocally(teamName);
  }

  let playersList = [];
  let mappedFromLineup = false;

  try {
    if (matchesData.results && matchesData.results.length > 0) {
      const lastEvent = matchesData.results[0];
      const lineupUrl = `https://www.thesportsdb.com/api/v1/json/3/lookuplineup.php?id=${lastEvent.idEvent}`;
      const lineupRes = await fetch(lineupUrl);
      if (lineupRes.ok) {
        const lineupData = await lineupRes.json();
        if (lineupData.lineup && lineupData.lineup.length > 0) {
          const teamLineup = lineupData.lineup.filter(p => p.idTeam === teamId);
          if (teamLineup.length > 0) {
            playersList = teamLineup.map(p => ({
              name: p.strPlayer,
              position: mapPosition(p.strPosition),
              number: p.intSquadNumber ? parseInt(p.intSquadNumber, 10) : null,
              isSub: p.strSubstitute === 'Yes'
            }));
            mappedFromLineup = true;
          }
        }
      }
    }
  } catch (err) {
    console.warn('   ⚠️ Lineup fetch failed, using full roster fallback...');
  }

  if (!mappedFromLineup || playersList.length === 0) {
    const playersUrl = `https://www.thesportsdb.com/api/v1/json/3/lookup_all_players.php?id=${teamId}`;
    const playersRes = await fetch(playersUrl);
    const playersData = await playersRes.json();
    if (playersData.player && playersData.player.length > 0) {
      playersList = playersData.player.map(p => ({
        name: p.strPlayer,
        position: mapPosition(p.strPosition),
        number: p.strNumber ? parseInt(p.strNumber, 10) : null,
        isSub: false
      }));
    }
  }

  if (playersList.length === 0) {
    throw new Error(`No players found for ${teamName} in TheSportsDB`);
  }

  let starters = [];
  let subs = [];
  if (mappedFromLineup) {
    starters = playersList.filter(p => !p.isSub).slice(0, 11);
    subs = playersList.filter(p => p.isSub).slice(0, 7);
  } else {
    const gks = playersList.filter(p => p.position === 'GK');
    const dfs = playersList.filter(p => ['CB', 'LB', 'RB'].includes(p.position));
    const mfs = playersList.filter(p => ['CDM', 'CM', 'CAM'].includes(p.position));
    const fws = playersList.filter(p => ['LW', 'RW', 'ST'].includes(p.position));

    if (gks.length > 0) starters.push(gks.shift());
    while (starters.length < 5 && dfs.length > 0) starters.push(dfs.shift());
    while (starters.length < 8 && mfs.length > 0) starters.push(mfs.shift());
    while (starters.length < 11 && fws.length > 0) starters.push(fws.shift());

    const pool = [...gks, ...dfs, ...mfs, ...fws];
    while (starters.length < 11 && pool.length > 0) starters.push(pool.shift());
    while (subs.length < 7 && pool.length > 0) subs.push(pool.shift());
  }

  const usedNumbers = new Set(playersList.map(p => p.number).filter(n => n !== null));
  const assignNums = (list) => {
    let next = 1;
    list.forEach(p => {
      if (!p.number) {
        while (usedNumbers.has(next)) next++;
        p.number = next;
        usedNumbers.add(next);
      }
    });
  };
  assignNums(starters);
  assignNums(subs);

  return { starters, subs, matches };
}

// 3. Gemini Direct Generation Fallback (Tier 4)
async function generateSquadAndMatchesWithAI(teamName, apiKey) {
  console.log(`   ✨ [Gemini AI] Direct-generating squad and matches for ${teamName}...`);
  const prompt = `You are a football data expert. Provide the squad (starting XI and 5 substitutes) and last 5 match results for the team "${teamName}".
Format the response as a valid JSON object:
{
  "starters": [
    {"number": 1, "name": "Player Name", "position": "GK"}
  ],
  "subs": [
    {"number": 12, "name": "Sub Name", "position": "CM"}
  ],
  "matches": [
    {"date": "18 May 2026", "home": "${teamName}", "away": "Chelsea", "score": "2-1", "result": "W", "competition": "Premier League"}
  ]
}
Use real players and matches where possible. Return ONLY the raw JSON object. No markdown, no prose.`;

  const raw = await callGemini(apiKey, prompt);
  const parsed = parseJsonSafe(raw);
  if (!parsed || !parsed.starters) {
    throw new Error('AI direct generation failed');
  }
  return parsed;
}

// 4. Local Procedural Fallback (Tier 5)
function generateSquadLocally(teamName) {
  const formation = '4-3-3';
  const positions = ['GK', 'RB', 'CB', 'CB', 'LB', 'CDM', 'CM', 'CAM', 'RW', 'LW', 'ST'];
  const genericNames = {
    GK: ['Goalkeeper'],
    RB: ['Right Back'],
    CB: ['Centre Back A', 'Centre Back B'],
    LB: ['Left Back'],
    CDM: ['Defensive Mid'],
    CM: ['Central Mid'],
    CAM: ['Attacking Mid'],
    RW: ['Right Winger'],
    LW: ['Left Winger'],
    ST: ['Striker']
  };

  const count = {};
  const starters = positions.map((pos, idx) => {
    count[pos] = (count[pos] || 0) + 1;
    const nameList = genericNames[pos];
    const name = nameList[count[pos] - 1] || `${pos} Player`;
    return {
      number: idx + 1,
      name: `${teamName} ${name}`,
      position: pos
    };
  });

  const subs = [
    { number: 12, name: `${teamName} Backup GK`, position: 'GK' },
    { number: 13, name: `${teamName} Sub Defender`, position: 'CB' },
    { number: 14, name: `${teamName} Sub Midfielder`, position: 'CM' },
    { number: 15, name: `${teamName} Sub Winger`, position: 'LW' },
    { number: 16, name: `${teamName} Sub Striker`, position: 'ST' }
  ];

  return { starters, subs };
}

function generateMatchesLocally(teamName) {
  const opponents = ['Arsenal', 'Chelsea', 'Man City', 'Liverpool', 'Man United'];
  const results = ['W', 'D', 'L'];
  return Array.from({ length: 5 }).map((_, idx) => {
    const opp = opponents[idx % opponents.length];
    const res = results[Math.floor(Math.random() * results.length)];
    const score = res === 'W' ? '2-1' : res === 'L' ? '1-2' : '1-1';
    return {
      date: new Date(Date.now() - idx * 7 * 24 * 60 * 60 * 1000).toDateString(),
      home: idx % 2 === 0 ? teamName : opp,
      away: idx % 2 === 0 ? opp : teamName,
      score,
      result: res,
      competition: 'League Match'
    };
  });
}

(async () => {
  const uri = process.env.MONGODB_URI;
  const apiKey = process.env.GEMINI_API_KEY;

  if (!uri) {
    console.error('❌ MONGODB_URI not found in .env');
    process.exit(1);
  }
  if (!apiKey) {
    console.error('❌ GEMINI_API_KEY not found in .env');
    process.exit(1);
  }

  try {
    console.log('🔗 Connecting to MongoDB...');
    await mongoose.connect(uri);
    console.log('✅ Connected to MongoDB');

    for (let i = 0; i < TEAMS_LIST.length; i++) {
      const team = TEAMS_LIST[i];
      const normName = normalizeTeamName(team.name);

      // Check if already cached
      const cached = await CachedSquad.findOne({ normalizedName: normName });
      if (cached) {
        console.log(`[${i + 1}/${TEAMS_LIST.length}] ⏭️ Skipping ${team.name} (already in local database)`);
        continue;
      }

      console.log(`[${i + 1}/${TEAMS_LIST.length}] 🌐 Scraping ${team.name} (domain: ${team.domain})...`);
      let data = null;
      let usedFallback = 'None';

      try {
        data = await fetchSquadAndMatchesFromWebSearch(team.name, team.domain, apiKey);
        usedFallback = 'Web Search (Official Website)';
      } catch (webErr) {
        console.warn(`   ⚠️ Web Search Grounding failed for ${team.name}: ${webErr.message}`);
        
        try {
          data = await fetchSquadAndMatchesFromSportsDB(team.name);
          usedFallback = 'TheSportsDB';
        } catch (dbErr) {
          console.warn(`   ⚠️ TheSportsDB failed for ${team.name}: ${dbErr.message}`);
          
          try {
            data = await generateSquadAndMatchesWithAI(team.name, apiKey);
            usedFallback = 'Gemini Direct Generation';
          } catch (aiErr) {
            console.warn(`   ⚠️ Gemini Direct Generation failed for ${team.name}: ${aiErr.message}`);
            
            const localSquad = generateSquadLocally(team.name);
            const localMatches = generateMatchesLocally(team.name);
            data = {
              starters: localSquad.starters,
              subs: localSquad.subs,
              matches: localMatches
            };
            usedFallback = 'Local Fallback Generator';
          }
        }
      }

      if (data) {
        await CachedSquad.findOneAndUpdate(
          { normalizedName: normName },
          {
            teamName: team.name,
            formation: '4-3-3',
            starters: data.starters,
            subs: data.subs,
            matches: data.matches,
            lastUpdated: new Date()
          },
          { upsert: true, new: true }
        );
        console.log(`   🟢 Saved ${team.name} using [${usedFallback}]`);
      }

      const needsGeminiCooldown = (usedFallback === 'Web Search (Official Website)' || usedFallback === 'Gemini Direct Generation');
      const cooldownMs = needsGeminiCooldown ? 10000 : 1000;
      console.log(`   💤 Cooling down for ${cooldownMs / 1000} seconds...`);
      await sleep(cooldownMs);
    }

    console.log('🎉 Seeding task complete!');
    process.exit(0);

  } catch (err) {
    console.error('❌ Seeding process error:', err.message);
    process.exit(1);
  }
})();
