/*
  # Create Bingo MeTis Database Schema

  ## Overview
  Creates tables for storing bingo templates, games, and feedback for the Bingo MeTis app.

  ## Tables Created
  
  ### bingo_templates
  - `id` (uuid, primary key) - Unique template identifier
  - `name` (text) - Template name
  - `description` (text) - Template description
  - `items` (jsonb) - Array of bingo items
  - `is_custom` (boolean) - Whether template is user-created
  - `code` (text, unique) - Share code for custom templates
  - `created_at` (timestamp) - Creation timestamp

  ### bingo_games
  - `id` (uuid, primary key) - Unique game identifier
  - `template_id` (uuid) - Reference to template
  - `template_name` (text) - Template name (denormalized for deleted templates)
  - `marked_cells` (jsonb) - Array of marked cell indices
  - `completed` (boolean) - Whether game is completed
  - `completed_at` (timestamp) - Completion timestamp
  - `created_at` (timestamp) - Creation timestamp
  - `started_at` (timestamp) - Start timestamp
  - `items` (jsonb) - Array of shuffled items for this game
  - `bingo_count` (integer) - Number of bingos achieved
  - `duration` (integer) - Game duration in seconds
  - `is_started` (boolean) - Whether game has been started
  - `first_bingo_time` (integer) - Time to first bingo
  - `three_bingos_time` (integer) - Time to three bingos
  - `full_card_time` (integer) - Time to full card

  ### feedback
  - `id` (uuid, primary key) - Unique feedback identifier
  - `message` (text) - Feedback message
  - `email` (text) - Optional user email
  - `created_at` (timestamp) - Creation timestamp

  ## Security
  - RLS enabled on all tables
  - Public read/write access (no authentication required)
*/

-- Create bingo_templates table
CREATE TABLE IF NOT EXISTS bingo_templates (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  name text NOT NULL,
  description text,
  items jsonb NOT NULL,
  is_custom boolean NOT NULL DEFAULT false,
  code text UNIQUE,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Create bingo_games table
CREATE TABLE IF NOT EXISTS bingo_games (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  template_id uuid REFERENCES bingo_templates(id) ON DELETE SET NULL,
  template_name text NOT NULL,
  marked_cells jsonb NOT NULL DEFAULT '[]'::jsonb,
  completed boolean NOT NULL DEFAULT false,
  completed_at timestamptz,
  created_at timestamptz NOT NULL DEFAULT now(),
  started_at timestamptz NOT NULL DEFAULT now(),
  items jsonb NOT NULL,
  bingo_count integer NOT NULL DEFAULT 0,
  duration integer,
  is_started boolean NOT NULL DEFAULT false,
  first_bingo_time integer,
  three_bingos_time integer,
  full_card_time integer
);

-- Create feedback table
CREATE TABLE IF NOT EXISTS feedback (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  message text NOT NULL,
  email text,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- Enable RLS
ALTER TABLE bingo_templates ENABLE ROW LEVEL SECURITY;
ALTER TABLE bingo_games ENABLE ROW LEVEL SECURITY;
ALTER TABLE feedback ENABLE ROW LEVEL SECURITY;

-- RLS Policies for bingo_templates
CREATE POLICY "Anyone can read templates"
  ON bingo_templates FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create custom templates"
  ON bingo_templates FOR INSERT
  TO public
  WITH CHECK (is_custom = true);

CREATE POLICY "Anyone can delete custom templates"
  ON bingo_templates FOR DELETE
  TO public
  USING (is_custom = true);

-- RLS Policies for bingo_games
CREATE POLICY "Anyone can read games"
  ON bingo_games FOR SELECT
  TO public
  USING (true);

CREATE POLICY "Anyone can create games"
  ON bingo_games FOR INSERT
  TO public
  WITH CHECK (true);

CREATE POLICY "Anyone can update games"
  ON bingo_games FOR UPDATE
  TO public
  USING (true);

CREATE POLICY "Anyone can delete games"
  ON bingo_games FOR DELETE
  TO public
  USING (true);

-- RLS Policies for feedback
CREATE POLICY "Anyone can submit feedback"
  ON feedback FOR INSERT
  TO public
  WITH CHECK (true);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_bingo_templates_is_custom ON bingo_templates(is_custom);
CREATE INDEX IF NOT EXISTS idx_bingo_templates_code ON bingo_templates(code);
CREATE INDEX IF NOT EXISTS idx_bingo_games_completed ON bingo_games(completed);
CREATE INDEX IF NOT EXISTS idx_bingo_games_template_id ON bingo_games(template_id);
CREATE INDEX IF NOT EXISTS idx_bingo_games_started_at ON bingo_games(started_at DESC);
CREATE INDEX IF NOT EXISTS idx_bingo_games_completed_at ON bingo_games(completed_at DESC);