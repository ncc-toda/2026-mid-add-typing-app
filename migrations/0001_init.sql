CREATE TABLE problems (
  id INTEGER PRIMARY KEY,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  channel TEXT,
  sender TEXT,
  incoming_message TEXT,
  reply_text TEXT,
  reply_reading TEXT,
  reply_units TEXT
);

CREATE INDEX idx_problems_difficulty ON problems (difficulty);

CREATE TABLE plays (
  id TEXT PRIMARY KEY,
  player_id TEXT NOT NULL,
  difficulty TEXT NOT NULL CHECK (difficulty IN ('beginner', 'intermediate', 'advanced')),
  salary INTEGER NOT NULL,
  kpm REAL NOT NULL,
  accuracy REAL NOT NULL,
  miss_count INTEGER NOT NULL,
  max_combo INTEGER NOT NULL,
  sent_count INTEGER NOT NULL,
  created_at TEXT NOT NULL
);

CREATE INDEX idx_plays_player_id ON plays (player_id);

CREATE TABLE player_key_stats (
  player_id TEXT PRIMARY KEY,
  keys_json TEXT NOT NULL,
  transitions_json TEXT NOT NULL,
  updated_at TEXT NOT NULL
);
