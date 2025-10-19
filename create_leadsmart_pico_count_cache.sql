-- Create Pico Count Cache table for LeadSmart Skylab System
-- This caches entity counts to avoid 300+ count queries on page load

CREATE TABLE IF NOT EXISTS leadsmart_pico_count_cache (
  -- Single row constraint
  cache_id INTEGER PRIMARY KEY DEFAULT 1,
  
  -- Cache data (JSONB for all entity counts)
  count_data JSONB NOT NULL DEFAULT '{
    "releases": {},
    "subsheets": {},
    "subparts": {}
  }'::jsonb,
  
  -- Metadata
  last_updated TIMESTAMPTZ DEFAULT NOW(),
  updated_by UUID,
  cache_version INTEGER DEFAULT 1,
  
  -- Rebuild tracking
  rebuild_in_progress BOOLEAN DEFAULT FALSE,
  last_rebuild_started_at TIMESTAMPTZ,
  last_rebuild_completed_at TIMESTAMPTZ,
  last_rebuild_duration_ms INTEGER,
  
  -- Statistics
  total_releases_cached INTEGER DEFAULT 0,
  total_subsheets_cached INTEGER DEFAULT 0,
  total_subparts_cached INTEGER DEFAULT 0,
  
  -- Timestamps
  created_at TIMESTAMPTZ DEFAULT NOW(),
  
  -- Ensure only one row exists
  CONSTRAINT single_row_cache CHECK (cache_id = 1)
);

-- Insert initial empty cache row
INSERT INTO leadsmart_pico_count_cache (cache_id, count_data)
VALUES (1, '{
  "releases": {},
  "subsheets": {},
  "subparts": {}
}'::jsonb)
ON CONFLICT (cache_id) DO NOTHING;

-- GIN index for fast JSONB queries
CREATE INDEX IF NOT EXISTS idx_pico_cache_data 
ON leadsmart_pico_count_cache USING GIN (count_data);

-- Function to get cache age
CREATE OR REPLACE FUNCTION get_pico_cache_age()
RETURNS INTERVAL AS $$
  SELECT NOW() - last_updated 
  FROM leadsmart_pico_count_cache 
  WHERE cache_id = 1;
$$ LANGUAGE SQL;

-- Function to check if rebuild is needed
CREATE OR REPLACE FUNCTION is_pico_cache_stale(max_age_minutes INTEGER DEFAULT 60)
RETURNS BOOLEAN AS $$
  SELECT 
    CASE 
      WHEN last_updated IS NULL THEN TRUE
      WHEN NOW() - last_updated > INTERVAL '1 minute' * max_age_minutes THEN TRUE
      ELSE FALSE
    END
  FROM leadsmart_pico_count_cache 
  WHERE cache_id = 1;
$$ LANGUAGE SQL;

-- View for cache status
CREATE OR REPLACE VIEW v_pico_cache_status AS
SELECT 
  cache_id,
  last_updated,
  EXTRACT(EPOCH FROM (NOW() - last_updated)) as age_seconds,
  ROUND(EXTRACT(EPOCH FROM (NOW() - last_updated)) / 60, 2) as age_minutes,
  rebuild_in_progress,
  last_rebuild_duration_ms,
  ROUND(last_rebuild_duration_ms / 1000.0, 2) as last_rebuild_duration_seconds,
  total_releases_cached,
  total_subsheets_cached,
  total_subparts_cached,
  cache_version,
  jsonb_object_keys(count_data->'releases') as sample_release_ids
FROM leadsmart_pico_count_cache
WHERE cache_id = 1;

-- Comments for documentation
COMMENT ON TABLE leadsmart_pico_count_cache IS 'Cache for LeadSmart Skylab tile table counts. Single-row table stores all entity counts in JSONB format to avoid 300+ count queries on page load.';
COMMENT ON COLUMN leadsmart_pico_count_cache.count_data IS 'JSONB object with structure: {"releases": {"1": {"zip_based_count": 45000, "transformed_count": 12000, "children_count": 3}}, "subsheets": {...}, "subparts": {...}}';
COMMENT ON COLUMN leadsmart_pico_count_cache.cache_id IS 'Always 1. Single-row table with CHECK constraint.';
COMMENT ON COLUMN leadsmart_pico_count_cache.rebuild_in_progress IS 'Flag to prevent concurrent rebuilds';

-- Example query to get counts for a specific release
-- SELECT count_data->'releases'->'5' FROM leadsmart_pico_count_cache WHERE cache_id = 1;

-- Verification
SELECT 'Pico Count Cache table created successfully' as status;

SELECT cache_id, last_updated, total_releases_cached, total_subsheets_cached, total_subparts_cached
FROM leadsmart_pico_count_cache;

