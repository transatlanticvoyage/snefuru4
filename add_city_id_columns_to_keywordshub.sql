-- ============================================================
-- Migration: Add City ID Columns to keywordshub Table
-- Purpose: Track exact and largest city associations for keywords
-- Created: 2025-10-17
-- ============================================================

-- Add the two new columns to keywordshub table
ALTER TABLE keywordshub 
  ADD COLUMN IF NOT EXISTS rel_largest_city_id INTEGER,
  ADD COLUMN IF NOT EXISTS rel_exact_city_id INTEGER;

-- Add foreign key constraints to maintain referential integrity
ALTER TABLE keywordshub 
  ADD CONSTRAINT fk_keywordshub_rel_largest_city_id 
  FOREIGN KEY (rel_largest_city_id) REFERENCES cities(city_id);

ALTER TABLE keywordshub 
  ADD CONSTRAINT fk_keywordshub_rel_exact_city_id 
  FOREIGN KEY (rel_exact_city_id) REFERENCES cities(city_id);

-- Add indexes for better query performance
CREATE INDEX IF NOT EXISTS idx_keywordshub_rel_largest_city_id 
  ON keywordshub(rel_largest_city_id);

CREATE INDEX IF NOT EXISTS idx_keywordshub_rel_exact_city_id 
  ON keywordshub(rel_exact_city_id);

-- Add comments for documentation
COMMENT ON COLUMN keywordshub.rel_largest_city_id IS 
  'City with largest population matching the city_name used in keyword rubric';

COMMENT ON COLUMN keywordshub.rel_exact_city_id IS 
  'Exact city matching both city_name and state_code used in keyword rubric';

-- ============================================================
-- Verification Query
-- ============================================================
-- Run this to verify the columns were added successfully:
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'keywordshub' 
--   AND column_name IN ('rel_largest_city_id', 'rel_exact_city_id');

