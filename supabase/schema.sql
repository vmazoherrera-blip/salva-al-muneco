-- Schema for "Salva al muñeco"
-- Real-time multiplayer educational game focused on Linear Transformation Matrices

-- Enable UUID extension if not already enabled
CREATE EXTENSION IF NOT EXISTS "uuid-ossp";

-- Drop existing tables if recreating
DROP TABLE IF EXISTS player_questions CASCADE;
DROP TABLE IF EXISTS players CASCADE;
DROP TABLE IF EXISTS rooms CASCADE;

-- 1. ROOMS TABLE
CREATE TABLE rooms (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  code VARCHAR(6) UNIQUE NOT NULL,
  host_token VARCHAR(255) NOT NULL,
  status VARCHAR(20) NOT NULL DEFAULT 'waiting' CHECK (status IN ('waiting', 'playing', 'finished')),
  time_per_question INTEGER NOT NULL DEFAULT 60 CHECK (time_per_question >= 30 AND time_per_question <= 120),
  max_players INTEGER NOT NULL DEFAULT 30,
  created_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now())
);

CREATE INDEX idx_rooms_code ON rooms(code);

-- 2. PLAYERS TABLE
CREATE TABLE players (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  room_id UUID NOT NULL REFERENCES rooms(id) ON DELETE CASCADE,
  player_token VARCHAR(255) NOT NULL,
  nickname VARCHAR(50) NOT NULL,
  score INTEGER NOT NULL DEFAULT 0,
  correct_count INTEGER NOT NULL DEFAULT 0,
  wrong_count INTEGER NOT NULL DEFAULT 0,
  danger_parts INTEGER NOT NULL DEFAULT 3 CHECK (danger_parts >= 0 AND danger_parts <= 6),
  status VARCHAR(20) NOT NULL DEFAULT 'jugando' CHECK (status IN ('jugando', 'eliminado', 'terminado')),
  current_question_index INTEGER NOT NULL DEFAULT 0,
  total_time_ms INTEGER NOT NULL DEFAULT 0,
  is_connected BOOLEAN NOT NULL DEFAULT true,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT timezone('utc'::text, now()),
  CONSTRAINT unique_player_in_room UNIQUE (room_id, player_token)
);

CREATE INDEX idx_players_room_id ON players(room_id);
CREATE INDEX idx_players_token ON players(player_token);

-- 3. PLAYER QUESTIONS TABLE (Zero-Trust storage of questions, answers, and timings)
CREATE TABLE player_questions (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  player_id UUID NOT NULL REFERENCES players(id) ON DELETE CASCADE,
  question_index INTEGER NOT NULL CHECK (question_index >= 0 AND question_index <= 9),
  level VARCHAR(20) NOT NULL,
  question_type VARCHAR(20) NOT NULL,
  prompt_latex TEXT NOT NULL,
  options_latex JSONB,
  correct_answer TEXT NOT NULL,
  explanation_latex TEXT NOT NULL,
  started_at TIMESTAMPTZ,
  answered_at TIMESTAMPTZ,
  is_correct BOOLEAN,
  CONSTRAINT unique_question_per_player UNIQUE (player_id, question_index)
);

CREATE INDEX idx_player_questions_player ON player_questions(player_id);

-- 4. ENABLE REALTIME
-- Adds rooms and players to supabase_realtime publication for instant state synchronization
ALTER PUBLICATION supabase_realtime ADD TABLE rooms;
ALTER PUBLICATION supabase_realtime ADD TABLE players;

-- 5. ROW LEVEL SECURITY (RLS)
ALTER TABLE rooms ENABLE ROW LEVEL SECURITY;
ALTER TABLE players ENABLE ROW LEVEL SECURITY;
ALTER TABLE player_questions ENABLE ROW LEVEL SECURITY;

-- Rooms: Public read access
CREATE POLICY "Public read rooms" ON rooms
  FOR SELECT
  TO public
  USING (true);

-- Players: Public read access (for lobby and real-time leaderboards)
CREATE POLICY "Public read players" ON players
  FOR SELECT
  TO public
  USING (true);

-- Player Questions: Zero-Trust. Public access is NOT granted.
-- Only backend service role key can access questions and answers.
CREATE POLICY "Service role full access player_questions" ON player_questions
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access rooms" ON rooms
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);

CREATE POLICY "Service role full access players" ON players
  FOR ALL
  TO service_role
  USING (true)
  WITH CHECK (true);
