-- ═══════════════════════════════════════════════════════════════════════════
-- BATCH TRACKING + HISTORICAL CACHE SYSTEM
-- Purpose: Track fetch origins (manual/bulk/fabric), group batches, preserve cache history
-- ═══════════════════════════════════════════════════════════════════════════

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 1: Create Batch Tracking Table
-- ═══════════════════════════════════════════════════════════════════════════

CREATE TABLE IF NOT EXISTS zhe_serp_fetch_batches (
  batch_id SERIAL PRIMARY KEY,
  batch_name VARCHAR(255),
  batch_source VARCHAR(50) NOT NULL CHECK (batch_source IN ('manual-serpjar', 'bulk-kwjar', 'batch-fabric')),
  initiated_by_user_id UUID,
  total_keywords INTEGER DEFAULT 0,
  completed_keywords INTEGER DEFAULT 0,
  failed_keywords INTEGER DEFAULT 0,
  status VARCHAR(50) DEFAULT 'in_progress' CHECK (status IN ('in_progress', 'completed', 'failed', 'cancelled')),
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  completed_at TIMESTAMP WITH TIME ZONE
);

-- Indexes for batch table
CREATE INDEX IF NOT EXISTS idx_zsfb_batch_source ON zhe_serp_fetch_batches(batch_source);
CREATE INDEX IF NOT EXISTS idx_zsfb_initiated_by ON zhe_serp_fetch_batches(initiated_by_user_id);
CREATE INDEX IF NOT EXISTS idx_zsfb_status ON zhe_serp_fetch_batches(status);
CREATE INDEX IF NOT EXISTS idx_zsfb_created_at ON zhe_serp_fetch_batches(created_at);

COMMENT ON TABLE zhe_serp_fetch_batches IS 'Groups related SERP fetches together (e.g., Fabric batch, Gazelle bulk, etc.)';
COMMENT ON COLUMN zhe_serp_fetch_batches.batch_source IS 'Origin: manual-serpjar (single), bulk-kwjar (Gazelle), batch-fabric (F370)';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 2: Add Batch Tracking to zhe_serp_fetches
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE zhe_serp_fetches 
ADD COLUMN IF NOT EXISTS batch_id INTEGER REFERENCES zhe_serp_fetch_batches(batch_id) ON DELETE SET NULL,
ADD COLUMN IF NOT EXISTS fetch_source VARCHAR(50) DEFAULT 'manual-serpjar' CHECK (fetch_source IN ('manual-serpjar', 'bulk-kwjar', 'batch-fabric')),
ADD COLUMN IF NOT EXISTS initiated_by_user_id UUID;

-- Indexes for new columns
CREATE INDEX IF NOT EXISTS idx_zsf_batch_id ON zhe_serp_fetches(batch_id);
CREATE INDEX IF NOT EXISTS idx_zsf_fetch_source ON zhe_serp_fetches(fetch_source);
CREATE INDEX IF NOT EXISTS idx_zsf_initiated_by ON zhe_serp_fetches(initiated_by_user_id);

COMMENT ON COLUMN zhe_serp_fetches.batch_id IS 'Links to zhe_serp_fetch_batches for grouped operations (NULL for single manual fetches)';
COMMENT ON COLUMN zhe_serp_fetches.fetch_source IS 'Source of this fetch: manual-serpjar, bulk-kwjar, or batch-fabric';
COMMENT ON COLUMN zhe_serp_fetches.initiated_by_user_id IS 'User who initiated this fetch';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 3: Add Historical Cache Support to keywordshub_emd_zone_cache
-- ═══════════════════════════════════════════════════════════════════════════

-- Add new columns for history tracking
ALTER TABLE keywordshub_emd_zone_cache
ADD COLUMN IF NOT EXISTS is_current BOOLEAN DEFAULT TRUE,
ADD COLUMN IF NOT EXISTS source_fetch_id INTEGER REFERENCES zhe_serp_fetches(fetch_id) ON DELETE CASCADE;

-- Drop old unique constraint (if exists)
ALTER TABLE keywordshub_emd_zone_cache DROP CONSTRAINT IF EXISTS keywordshub_emd_zone_cache_keyword_id_emd_stamp_method_key;

-- Create new unique constraint allowing multiple historical entries per keyword/method
CREATE UNIQUE INDEX IF NOT EXISTS idx_kezc_unique_keyword_method_fetch 
ON keywordshub_emd_zone_cache(keyword_id, emd_stamp_method, source_fetch_id);

-- Index for filtering current cache
CREATE INDEX IF NOT EXISTS idx_kezc_is_current ON keywordshub_emd_zone_cache(is_current) WHERE is_current = TRUE;
CREATE INDEX IF NOT EXISTS idx_kezc_source_fetch_id ON keywordshub_emd_zone_cache(source_fetch_id);

COMMENT ON COLUMN keywordshub_emd_zone_cache.is_current IS 'TRUE = latest cache for this keyword/method. FALSE = historical cache';
COMMENT ON COLUMN keywordshub_emd_zone_cache.source_fetch_id IS 'Which zhe_serp_fetches record this cache was built from';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 4: Remove Redundant Column from keywordshub
-- ═══════════════════════════════════════════════════════════════════════════

ALTER TABLE keywordshub DROP COLUMN IF EXISTS latest_fetch_id;

-- Reason: Redundant - can query zhe_serp_fetches WHERE is_latest = TRUE

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 5: Backfill Existing Data
-- ═══════════════════════════════════════════════════════════════════════════

-- Set all existing fetches to 'manual-serpjar' source (safe default)
UPDATE zhe_serp_fetches 
SET fetch_source = 'manual-serpjar'
WHERE fetch_source IS NULL;

-- Make fetch_source NOT NULL after backfill
ALTER TABLE zhe_serp_fetches ALTER COLUMN fetch_source SET NOT NULL;

-- Set all existing cache entries to is_current = TRUE
UPDATE keywordshub_emd_zone_cache
SET is_current = TRUE
WHERE is_current IS NULL;

-- Try to set source_fetch_id for existing cache entries
-- Link to the latest fetch for that keyword
UPDATE keywordshub_emd_zone_cache kc
SET source_fetch_id = (
  SELECT fetch_id 
  FROM zhe_serp_fetches 
  WHERE rel_keyword_id = kc.keyword_id 
  ORDER BY created_at DESC 
  LIMIT 1
)
WHERE source_fetch_id IS NULL;

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 6: Create Helper Functions
-- ═══════════════════════════════════════════════════════════════════════════

-- Function to create a new batch
CREATE OR REPLACE FUNCTION create_serp_fetch_batch(
  p_batch_name VARCHAR(255),
  p_batch_source VARCHAR(50),
  p_user_id UUID,
  p_total_keywords INTEGER
)
RETURNS INTEGER
LANGUAGE plpgsql
AS $$
DECLARE
  v_batch_id INTEGER;
BEGIN
  INSERT INTO zhe_serp_fetch_batches (
    batch_name, 
    batch_source, 
    initiated_by_user_id, 
    total_keywords,
    status
  ) VALUES (
    p_batch_name,
    p_batch_source,
    p_user_id,
    p_total_keywords,
    'in_progress'
  )
  RETURNING batch_id INTO v_batch_id;
  
  RETURN v_batch_id;
END;
$$;

COMMENT ON FUNCTION create_serp_fetch_batch IS 'Creates a new batch record and returns the batch_id';

-- Function to update batch progress
CREATE OR REPLACE FUNCTION update_batch_progress(
  p_batch_id INTEGER,
  p_completed INTEGER DEFAULT NULL,
  p_failed INTEGER DEFAULT NULL,
  p_status VARCHAR(50) DEFAULT NULL
)
RETURNS VOID
LANGUAGE plpgsql
AS $$
BEGIN
  UPDATE zhe_serp_fetch_batches
  SET 
    completed_keywords = COALESCE(p_completed, completed_keywords),
    failed_keywords = COALESCE(p_failed, failed_keywords),
    status = COALESCE(p_status, status),
    completed_at = CASE WHEN p_status IN ('completed', 'failed', 'cancelled') THEN NOW() ELSE completed_at END
  WHERE batch_id = p_batch_id;
END;
$$;

COMMENT ON FUNCTION update_batch_progress IS 'Updates batch progress and status';

-- ═══════════════════════════════════════════════════════════════════════════
-- STEP 7: Create View for Easy Querying
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE VIEW v_serp_fetches_with_batch AS
SELECT 
  zsf.fetch_id,
  zsf.rel_keyword_id,
  zsf.fetch_version,
  zsf.is_latest,
  zsf.fetch_source,
  zsf.batch_id,
  zsf.initiated_by_user_id,
  zsf.created_at AS fetch_created_at,
  kh.keyword_datum,
  zsfb.batch_name,
  zsfb.batch_source AS batch_source_type,
  zsfb.status AS batch_status,
  zsfb.total_keywords AS batch_total_kw,
  zsfb.completed_keywords AS batch_completed_kw
FROM zhe_serp_fetches zsf
LEFT JOIN keywordshub kh ON kh.keyword_id = zsf.rel_keyword_id
LEFT JOIN zhe_serp_fetch_batches zsfb ON zsfb.batch_id = zsf.batch_id;

COMMENT ON VIEW v_serp_fetches_with_batch IS 'Join view showing fetches with their batch information and keyword data';

-- ═══════════════════════════════════════════════════════════════════════════
-- VERIFICATION QUERIES
-- ═══════════════════════════════════════════════════════════════════════════

-- Check table structures
SELECT 'zhe_serp_fetch_batches' AS table_name, COUNT(*) AS row_count FROM zhe_serp_fetch_batches
UNION ALL
SELECT 'zhe_serp_fetches with batch_id', COUNT(*) FROM zhe_serp_fetches WHERE batch_id IS NOT NULL
UNION ALL
SELECT 'zhe_serp_fetches with fetch_source', COUNT(*) FROM zhe_serp_fetches WHERE fetch_source IS NOT NULL
UNION ALL
SELECT 'keywordshub_emd_zone_cache current', COUNT(*) FROM keywordshub_emd_zone_cache WHERE is_current = TRUE
UNION ALL
SELECT 'keywordshub_emd_zone_cache historical', COUNT(*) FROM keywordshub_emd_zone_cache WHERE is_current = FALSE;

-- Show sample batch data (if any batches exist)
SELECT 
  batch_id,
  batch_name,
  batch_source,
  total_keywords,
  completed_keywords || '/' || total_keywords AS progress,
  status,
  created_at
FROM zhe_serp_fetch_batches
ORDER BY created_at DESC
LIMIT 10;

