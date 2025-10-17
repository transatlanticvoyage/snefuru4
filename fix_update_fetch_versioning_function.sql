-- ═══════════════════════════════════════════════════════════════════════════
-- FIX: update_fetch_versioning function
-- Remove reference to dropped keywordshub.latest_fetch_id column
-- ═══════════════════════════════════════════════════════════════════════════

CREATE OR REPLACE FUNCTION update_fetch_versioning(p_keyword_id INTEGER, p_new_fetch_id INTEGER)
RETURNS VOID
LANGUAGE plpgsql
AS $$
DECLARE
  v_next_version INTEGER;
BEGIN
  -- Get the next version number for this keyword
  SELECT COALESCE(MAX(fetch_version), 0) + 1
  INTO v_next_version
  FROM zhe_serp_fetches
  WHERE rel_keyword_id = p_keyword_id;
  
  -- Set all previous fetches for this keyword to is_latest = FALSE
  UPDATE zhe_serp_fetches
  SET is_latest = FALSE
  WHERE rel_keyword_id = p_keyword_id;
  
  -- Set the new fetch as latest with correct version
  UPDATE zhe_serp_fetches
  SET 
    is_latest = TRUE,
    fetch_version = v_next_version
  WHERE fetch_id = p_new_fetch_id;
  
  -- Note: No longer updating keywordshub.latest_fetch_id (column was removed)
  -- Use query: SELECT fetch_id FROM zhe_serp_fetches WHERE rel_keyword_id = X AND is_latest = TRUE
  
  RAISE NOTICE 'Updated fetch % for keyword % as version % (latest)', p_new_fetch_id, p_keyword_id, v_next_version;
END;
$$;

COMMENT ON FUNCTION update_fetch_versioning IS 'Updates versioning metadata when a new SERP fetch is created. Call this from F400 routes after inserting a new fetch record.';

