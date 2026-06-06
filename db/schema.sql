-- ═══════════════════════════════════════════════════════════════════════════
--  Playbook Live — Full Database Schema
--  Run via: psql -d playbook_live -f server/db/schema.sql
-- ═══════════════════════════════════════════════════════════════════════════

-- Drop in reverse dependency order
DROP TABLE IF EXISTS player_ratings CASCADE;
DROP TABLE IF EXISTS key_moments   CASCADE;
DROP TABLE IF EXISTS match_stats   CASCADE;
DROP TABLE IF EXISTS matches       CASCADE;
DROP TABLE IF EXISTS squad_players CASCADE;
DROP TABLE IF EXISTS squads        CASCADE;
DROP TABLE IF EXISTS plays         CASCADE;
DROP TABLE IF EXISTS boards        CASCADE;
DROP TABLE IF EXISTS teams         CASCADE;
DROP TABLE IF EXISTS users         CASCADE;

-- ── Users ─────────────────────────────────────────────────────────────────────
CREATE TABLE users (
  id            SERIAL PRIMARY KEY,
  username      VARCHAR(50)  UNIQUE NOT NULL,
  email         VARCHAR(255) UNIQUE NOT NULL,
  password_hash VARCHAR(255) NOT NULL,
  created_at    TIMESTAMPTZ  DEFAULT CURRENT_TIMESTAMP
);

-- ── Teams (clubs managed by a user) ──────────────────────────────────────────
CREATE TABLE teams (
  id         SERIAL PRIMARY KEY,
  name       VARCHAR(100) NOT NULL,
  short_name VARCHAR(10),
  crest_url  VARCHAR(500),
  owner_id   INTEGER REFERENCES users(id) ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Tactical Boards ───────────────────────────────────────────────────────────
CREATE TABLE boards (
  id         SERIAL  PRIMARY KEY,
  title      VARCHAR(100) NOT NULL,
  sport_type VARCHAR(50)  NOT NULL DEFAULT 'soccer',
  team_id    INTEGER REFERENCES teams(id)  ON DELETE SET NULL,
  owner_id   INTEGER REFERENCES users(id)  ON DELETE CASCADE,
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Saved Plays (recorded animations) ────────────────────────────────────────
CREATE TABLE plays (
  id              SERIAL PRIMARY KEY,
  board_id        INTEGER REFERENCES boards(id) ON DELETE CASCADE,
  title           VARCHAR(100) NOT NULL,
  initial_state   JSONB NOT NULL,
  animation_steps JSONB NOT NULL,
  created_at      TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Squads (named squad snapshots per team) ───────────────────────────────────
CREATE TABLE squads (
  id         SERIAL PRIMARY KEY,
  team_id    INTEGER REFERENCES teams(id) ON DELETE CASCADE,
  user_id    INTEGER REFERENCES users(id) ON DELETE CASCADE,
  name       VARCHAR(100) NOT NULL DEFAULT 'Main Squad',
  formation  VARCHAR(20)  NOT NULL DEFAULT '4-3-3',
  created_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP,
  updated_at TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Squad Players (individual player rows within a squad) ─────────────────────
CREATE TABLE squad_players (
  id            SERIAL  PRIMARY KEY,
  squad_id      INTEGER REFERENCES squads(id) ON DELETE CASCADE,
  number        SMALLINT NOT NULL,
  name          VARCHAR(100) NOT NULL,
  position      VARCHAR(10)  NOT NULL,         -- GK/CB/LB/RB/CDM/CM/CAM/LW/RW/ST
  role          VARCHAR(100),
  role_note     TEXT,
  is_sub        BOOLEAN  NOT NULL DEFAULT FALSE,
  pos_x         REAL     NOT NULL DEFAULT 50,  -- % across pitch
  pos_y         REAL     NOT NULL DEFAULT 50,  -- % up pitch
  recent_rating REAL,                          -- 0-10
  zone          VARCHAR(50),
  sort_order    SMALLINT NOT NULL DEFAULT 0,
  created_at    TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Matches (post-match analysis records) ────────────────────────────────────
CREATE TABLE matches (
  id           SERIAL PRIMARY KEY,
  user_id      INTEGER REFERENCES users(id) ON DELETE CASCADE,
  query        VARCHAR(300) NOT NULL,  -- e.g. "Man City vs Arsenal March 2025"
  match_date   VARCHAR(50),
  stadium      VARCHAR(150),
  match_score  VARCHAR(20),
  home_team    JSONB,    -- { name, color, players[] }
  away_team    JSONB,    -- { name, color, players[] }
  raw_response JSONB,   -- full AI payload for re-rendering
  created_at   TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Match Key Moments ─────────────────────────────────────────────────────────
CREATE TABLE key_moments (
  id          SERIAL  PRIMARY KEY,
  match_id    INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  minute      SMALLINT NOT NULL,
  description TEXT     NOT NULL,
  team        VARCHAR(100),
  moment_type VARCHAR(50) DEFAULT 'goal',  -- goal / card / sub / chance
  created_at  TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Player Ratings (per player per match) ────────────────────────────────────
CREATE TABLE player_ratings (
  id             SERIAL PRIMARY KEY,
  match_id       INTEGER REFERENCES matches(id) ON DELETE CASCADE,
  squad_player_id INTEGER REFERENCES squad_players(id) ON DELETE SET NULL,
  player_name    VARCHAR(100) NOT NULL,
  position       VARCHAR(10),
  team_name      VARCHAR(100),
  side           VARCHAR(4) NOT NULL DEFAULT 'home',  -- home / away
  rating         REAL  NOT NULL,
  summary        TEXT,
  minutes_played SMALLINT,
  created_at     TIMESTAMPTZ DEFAULT CURRENT_TIMESTAMP
);

-- ── Indexes ───────────────────────────────────────────────────────────────────
CREATE INDEX idx_boards_owner        ON boards(owner_id);
CREATE INDEX idx_plays_board         ON plays(board_id);
CREATE INDEX idx_squads_user         ON squads(user_id);
CREATE INDEX idx_squad_players_squad ON squad_players(squad_id);
CREATE INDEX idx_matches_user        ON matches(user_id);
CREATE INDEX idx_key_moments_match   ON key_moments(match_id);
CREATE INDEX idx_player_ratings_match ON player_ratings(match_id);

-- ── Utility function: auto-update updated_at on squads ───────────────────────
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS TRIGGER LANGUAGE plpgsql AS $$
BEGIN
  NEW.updated_at = CURRENT_TIMESTAMP;
  RETURN NEW;
END;
$$;

CREATE TRIGGER squads_updated_at
  BEFORE UPDATE ON squads
  FOR EACH ROW EXECUTE FUNCTION update_updated_at();
