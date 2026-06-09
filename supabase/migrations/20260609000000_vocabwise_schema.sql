-- ═══════════════════════════════════════════════════════════════
-- VocabWise Academic — Supabase Schema
-- Prefix: vw_ (tránh xung đột với VocabWise Kids tables)
-- Auth: dùng family_id TEXT (custom JWT) thay vì auth.users UUID
-- ═══════════════════════════════════════════════════════════════

-- ─────────────────────────────────────────
-- CONTENT TABLES (static, seeded from JSON)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vw_books (
  id            SMALLINT PRIMARY KEY,          -- 1, 2, 3
  title         TEXT NOT NULL,                 -- 'VocabWise Starter'
  cefr_level    TEXT NOT NULL,                 -- 'A1-A2'
  combo         TEXT NOT NULL,                 -- 'A', 'B', 'C'
  total_topics  SMALLINT NOT NULL,
  format        TEXT NOT NULL                  -- 'print', 'app'
);

CREATE TABLE IF NOT EXISTS vw_themes (
  id            SERIAL PRIMARY KEY,
  book_id       SMALLINT NOT NULL REFERENCES vw_books(id),
  theme_number  SMALLINT NOT NULL,
  theme_title   TEXT NOT NULL,
  UNIQUE (book_id, theme_number)
);

CREATE TABLE IF NOT EXISTS vw_topics (
  id            SERIAL PRIMARY KEY,
  topic_id      TEXT NOT NULL UNIQUE,          -- 'b1-t01', 'b2-t15'
  book_id       SMALLINT NOT NULL REFERENCES vw_books(id),
  theme_id      INT NOT NULL REFERENCES vw_themes(id),
  topic_number  SMALLINT NOT NULL,
  topic_title   TEXT NOT NULL,
  status        TEXT NOT NULL DEFAULT 'draft', -- 'draft','qa_pass','final'
  combo         TEXT NOT NULL,                 -- 'A','B1','B2','B3','C1','C2','C3'
  UNIQUE (book_id, topic_number)
);

CREATE TABLE IF NOT EXISTS vw_passages (
  id            SERIAL PRIMARY KEY,
  topic_id      TEXT NOT NULL REFERENCES vw_topics(topic_id),
  word_count    SMALLINT NOT NULL,
  para_index    SMALLINT NOT NULL,
  text_en       TEXT NOT NULL,                 -- with **bold** target words
  text_vi       TEXT NOT NULL,
  UNIQUE (topic_id, para_index)
);

CREATE TABLE IF NOT EXISTS vw_glossary (
  id                    SERIAL PRIMARY KEY,
  topic_id              TEXT NOT NULL REFERENCES vw_topics(topic_id),
  item_order            SMALLINT NOT NULL,      -- 1–15
  word                  TEXT NOT NULL,
  ipa                   TEXT,
  pos                   TEXT NOT NULL,
  meaning_vi            TEXT NOT NULL,
  meaning_vi_inline     TEXT NOT NULL,
  example_en            TEXT NOT NULL,
  example_vi            TEXT NOT NULL,
  word_family           JSONB,                  -- {noun, verb, adjective, adverb}
  false_friend          JSONB,                  -- {word_vi, explanation_vi} or null
  receptive_productive  TEXT,                   -- 'R' or 'P' (Book 2 & 3 only)
  item_type             TEXT NOT NULL DEFAULT 'word', -- 'word' or 'collocation'
  UNIQUE (topic_id, item_order)
);

CREATE TABLE IF NOT EXISTS vw_exercises (
  id            SERIAL PRIMARY KEY,
  topic_id      TEXT NOT NULL REFERENCES vw_topics(topic_id),
  ex_number     SMALLINT NOT NULL,             -- 1–5
  ex_type       TEXT NOT NULL,                 -- 'E1'–'E8'
  ex_name       TEXT NOT NULL,
  instruction   TEXT NOT NULL,
  items         JSONB NOT NULL,
  word_bank     JSONB,                         -- for E4 gap-fill only
  answer_key    JSONB NOT NULL,
  UNIQUE (topic_id, ex_number)
);

-- ─────────────────────────────────────────
-- USER PROGRESS TABLES
-- dùng family_id TEXT (custom JWT auth, không phải Supabase UUID)
-- ─────────────────────────────────────────

CREATE TABLE IF NOT EXISTS vw_user_topic_progress (
  id              SERIAL PRIMARY KEY,
  family_id       TEXT NOT NULL,               -- references families.id (custom auth)
  topic_id        TEXT NOT NULL REFERENCES vw_topics(topic_id),
  started_at      TIMESTAMPTZ DEFAULT NOW(),
  completed_at    TIMESTAMPTZ,
  last_accessed   TIMESTAMPTZ DEFAULT NOW(),
  passage_read    BOOLEAN DEFAULT FALSE,
  glossary_done   BOOLEAN DEFAULT FALSE,
  ex1_score       SMALLINT,
  ex2_score       SMALLINT,
  ex3_score       SMALLINT,
  ex4_score       SMALLINT,
  ex5_score       SMALLINT,
  total_score     SMALLINT,                    -- 0–25
  UNIQUE (family_id, topic_id)
);

CREATE TABLE IF NOT EXISTS vw_user_word_progress (
  id              SERIAL PRIMARY KEY,
  family_id       TEXT NOT NULL,
  topic_id        TEXT NOT NULL REFERENCES vw_topics(topic_id),
  item_order      SMALLINT NOT NULL,
  status          TEXT DEFAULT 'unseen',       -- 'unseen','seen','learning','mastered'
  correct_count   SMALLINT DEFAULT 0,
  attempt_count   SMALLINT DEFAULT 0,
  last_seen       TIMESTAMPTZ,
  next_review     TIMESTAMPTZ,
  UNIQUE (family_id, topic_id, item_order)
);

-- ─────────────────────────────────────────
-- ROW LEVEL SECURITY
-- ─────────────────────────────────────────

-- Content: public read
ALTER TABLE vw_books      ENABLE ROW LEVEL SECURITY;
ALTER TABLE vw_themes     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vw_topics     ENABLE ROW LEVEL SECURITY;
ALTER TABLE vw_passages   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vw_glossary   ENABLE ROW LEVEL SECURITY;
ALTER TABLE vw_exercises  ENABLE ROW LEVEL SECURITY;

CREATE POLICY "public read vw_books"     ON vw_books     FOR SELECT USING (true);
CREATE POLICY "public read vw_themes"    ON vw_themes    FOR SELECT USING (true);
CREATE POLICY "public read vw_topics"    ON vw_topics    FOR SELECT USING (true);
CREATE POLICY "public read vw_passages"  ON vw_passages  FOR SELECT USING (true);
CREATE POLICY "public read vw_glossary"  ON vw_glossary  FOR SELECT USING (true);
CREATE POLICY "public read vw_exercises" ON vw_exercises FOR SELECT USING (true);

-- Progress: service role only (custom JWT auth — RLS bypass via service key in API routes)
ALTER TABLE vw_user_topic_progress ENABLE ROW LEVEL SECURITY;
ALTER TABLE vw_user_word_progress  ENABLE ROW LEVEL SECURITY;

-- API routes dùng SUPABASE_SERVICE_ROLE_KEY → bypass RLS
-- Không cần thêm policy cho progress tables (service key đủ)

-- ─────────────────────────────────────────
-- SEED: Books
-- ─────────────────────────────────────────

INSERT INTO vw_books (id, title, cefr_level, combo, total_topics, format) VALUES
  (1, 'VocabWise Starter',  'A1-A2', 'A',  60, 'print'),
  (2, 'VocabWise Progress', 'B1-B2', 'B',  60, 'app'),
  (3, 'VocabWise Mastery',  'C1-C2', 'C',  30, 'app')
ON CONFLICT (id) DO NOTHING;

-- ─────────────────────────────────────────
-- INDEXES for performance
-- ─────────────────────────────────────────

CREATE INDEX IF NOT EXISTS idx_vw_topics_book_id   ON vw_topics (book_id);
CREATE INDEX IF NOT EXISTS idx_vw_topics_theme_id  ON vw_topics (theme_id);
CREATE INDEX IF NOT EXISTS idx_vw_passages_topic   ON vw_passages (topic_id);
CREATE INDEX IF NOT EXISTS idx_vw_glossary_topic   ON vw_glossary (topic_id);
CREATE INDEX IF NOT EXISTS idx_vw_exercises_topic  ON vw_exercises (topic_id);
CREATE INDEX IF NOT EXISTS idx_vw_utp_family       ON vw_user_topic_progress (family_id);
CREATE INDEX IF NOT EXISTS idx_vw_uwp_family       ON vw_user_word_progress (family_id);
