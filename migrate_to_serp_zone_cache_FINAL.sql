-- =====================================================
-- SERP ZONE CACHE MIGRATION - FINAL
-- Migrates from EMD-only to Universal (all domains)
-- =====================================================

-- STEP 1: Rename main table
-- =====================================================
ALTER TABLE keywordshub_emd_zone_cache 
RENAME TO keywordshub_serp_zone_cache;

COMMENT ON TABLE keywordshub_serp_zone_cache IS 
  'Universal SERP zone cache storing all domains (EMD and non-EMD) per ranking zone with is_emd_m1 flags.';


-- STEP 2: Rename count columns (add _emd suffix for clarity)
-- =====================================================

ALTER TABLE keywordshub_serp_zone_cache
RENAME COLUMN total_emd_sites TO total_emd_count;

ALTER TABLE keywordshub_serp_zone_cache
RENAME COLUMN zone_1_count TO zone_1_emd_count;

ALTER TABLE keywordshub_serp_zone_cache
RENAME COLUMN zone_2_count TO zone_2_emd_count;

ALTER TABLE keywordshub_serp_zone_cache
RENAME COLUMN zone_3_count TO zone_3_emd_count;

ALTER TABLE keywordshub_serp_zone_cache
RENAME COLUMN zone_4_10_count TO zone_4_10_emd_count;

ALTER TABLE keywordshub_serp_zone_cache
RENAME COLUMN zone_11_25_count TO zone_11_25_emd_count;

ALTER TABLE keywordshub_serp_zone_cache
RENAME COLUMN zone_26_50_count TO zone_26_50_emd_count;

ALTER TABLE keywordshub_serp_zone_cache
RENAME COLUMN zone_51_100_count TO zone_51_100_emd_count;

COMMENT ON COLUMN keywordshub_serp_zone_cache.total_emd_count IS 'Total EMD matches across all zones for method 1';
COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_1_emd_count IS 'EMD match count in zone 1 (rank 1)';
COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_2_emd_count IS 'EMD match count in zone 2 (rank 2)';
COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_3_emd_count IS 'EMD match count in zone 3 (rank 3)';
COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_4_10_emd_count IS 'EMD match count in zone 4-10 (ranks 4-10)';
COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_11_25_emd_count IS 'EMD match count in zone 11-25 (ranks 11-25)';
COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_26_50_emd_count IS 'EMD match count in zone 26-50 (ranks 26-50)';
COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_51_100_emd_count IS 'EMD match count in zone 51-100 (ranks 51-100)';


-- STEP 3: Update comments on domain columns (no rename, just clarify purpose)
-- =====================================================

COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_1_domains IS 
  'All domains in zone 1 (rank 1) with EMD flags: {"domains": [{"domain": "...", "rank": 1, "url": "...", "is_emd_m1": true}]}';

COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_2_domains IS 
  'All domains in zone 2 (rank 2) with EMD flags';

COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_3_domains IS 
  'All domains in zone 3 (rank 3) with EMD flags';

COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_4_10_domains IS 
  'All domains in zone 4-10 (ranks 4-10) with EMD flags';

COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_11_25_domains IS 
  'All domains in zone 11-25 (ranks 11-25) with EMD flags';

COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_26_50_domains IS 
  'All domains in zone 26-50 (ranks 26-50) with EMD flags';

COMMENT ON COLUMN keywordshub_serp_zone_cache.zone_51_100_domains IS 
  'All domains in zone 51-100 (ranks 51-100) with EMD flags';


-- STEP 4: Create JSONB migration function
-- =====================================================
-- Converts existing EMD-only JSONB arrays to new all-domains format
-- OLD: [{"domain": "pestbr.com", "rank": 4, "url": "...", "result_id": 123}]
-- NEW: {"domains": [{"domain": "pestbr.com", "rank": 4, "url": "...", "is_emd_m1": true}]}

CREATE OR REPLACE FUNCTION migrate_serp_zone_jsonb_data()
RETURNS TABLE(
  migrated_rows INTEGER,
  migrated_at TIMESTAMP WITH TIME ZONE
)
LANGUAGE plpgsql
AS $$
DECLARE
  v_updated_count INTEGER := 0;
BEGIN
  -- Update all rows - wrap arrays in {"domains": ...} and add is_emd_m1: true
  UPDATE keywordshub_serp_zone_cache
  SET
    -- Zone 1: Convert array to object format with EMD flags
    zone_1_domains = CASE 
      WHEN zone_1_domains IS NOT NULL AND jsonb_typeof(zone_1_domains) = 'array' 
      THEN jsonb_build_object('domains', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'domain', elem->>'domain',
            'rank', (elem->>'rank')::integer,
            'url', elem->>'url',
            'is_emd_m1', true
          )
        )
        FROM jsonb_array_elements(zone_1_domains) AS elem
      ))
      ELSE jsonb_build_object('domains', '[]'::jsonb)
    END,
    
    zone_2_domains = CASE 
      WHEN zone_2_domains IS NOT NULL AND jsonb_typeof(zone_2_domains) = 'array' 
      THEN jsonb_build_object('domains', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'domain', elem->>'domain',
            'rank', (elem->>'rank')::integer,
            'url', elem->>'url',
            'is_emd_m1', true
          )
        )
        FROM jsonb_array_elements(zone_2_domains) AS elem
      ))
      ELSE jsonb_build_object('domains', '[]'::jsonb)
    END,
    
    zone_3_domains = CASE 
      WHEN zone_3_domains IS NOT NULL AND jsonb_typeof(zone_3_domains) = 'array' 
      THEN jsonb_build_object('domains', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'domain', elem->>'domain',
            'rank', (elem->>'rank')::integer,
            'url', elem->>'url',
            'is_emd_m1', true
          )
        )
        FROM jsonb_array_elements(zone_3_domains) AS elem
      ))
      ELSE jsonb_build_object('domains', '[]'::jsonb)
    END,
    
    zone_4_10_domains = CASE 
      WHEN zone_4_10_domains IS NOT NULL AND jsonb_typeof(zone_4_10_domains) = 'array' 
      THEN jsonb_build_object('domains', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'domain', elem->>'domain',
            'rank', (elem->>'rank')::integer,
            'url', elem->>'url',
            'is_emd_m1', true
          )
        )
        FROM jsonb_array_elements(zone_4_10_domains) AS elem
      ))
      ELSE jsonb_build_object('domains', '[]'::jsonb)
    END,
    
    zone_11_25_domains = CASE 
      WHEN zone_11_25_domains IS NOT NULL AND jsonb_typeof(zone_11_25_domains) = 'array' 
      THEN jsonb_build_object('domains', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'domain', elem->>'domain',
            'rank', (elem->>'rank')::integer,
            'url', elem->>'url',
            'is_emd_m1', true
          )
        )
        FROM jsonb_array_elements(zone_11_25_domains) AS elem
      ))
      ELSE jsonb_build_object('domains', '[]'::jsonb)
    END,
    
    zone_26_50_domains = CASE 
      WHEN zone_26_50_domains IS NOT NULL AND jsonb_typeof(zone_26_50_domains) = 'array' 
      THEN jsonb_build_object('domains', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'domain', elem->>'domain',
            'rank', (elem->>'rank')::integer,
            'url', elem->>'url',
            'is_emd_m1', true
          )
        )
        FROM jsonb_array_elements(zone_26_50_domains) AS elem
      ))
      ELSE jsonb_build_object('domains', '[]'::jsonb)
    END,
    
    zone_51_100_domains = CASE 
      WHEN zone_51_100_domains IS NOT NULL AND jsonb_typeof(zone_51_100_domains) = 'array' 
      THEN jsonb_build_object('domains', (
        SELECT jsonb_agg(
          jsonb_build_object(
            'domain', elem->>'domain',
            'rank', (elem->>'rank')::integer,
            'url', elem->>'url',
            'is_emd_m1', true
          )
        )
        FROM jsonb_array_elements(zone_51_100_domains) AS elem
      ))
      ELSE jsonb_build_object('domains', '[]'::jsonb)
    END;
  
  GET DIAGNOSTICS v_updated_count = ROW_COUNT;
  
  RETURN QUERY SELECT v_updated_count, NOW();
END;
$$;

COMMENT ON FUNCTION migrate_serp_zone_jsonb_data() IS 
  'One-time migration function to convert existing EMD-only JSONB arrays to new universal format. All existing domains get is_emd_m1=true flag.';


-- STEP 5: Update view with new table/column names
-- =====================================================

DROP VIEW IF EXISTS v_emd_matches_full;

CREATE OR REPLACE VIEW v_serp_zone_cache_full AS
SELECT 
  kc.cache_id,
  kc.keyword_id,
  kh.keyword_datum,
  kc.emd_stamp_method,
  kc.total_emd_count,
  kc.zone_1_emd_count,
  kc.zone_1_domains,
  kc.zone_2_emd_count,
  kc.zone_2_domains,
  kc.zone_3_emd_count,
  kc.zone_3_domains,
  kc.zone_4_10_emd_count,
  kc.zone_4_10_domains,
  kc.zone_11_25_emd_count,
  kc.zone_11_25_domains,
  kc.zone_26_50_emd_count,
  kc.zone_26_50_domains,
  kc.zone_51_100_emd_count,
  kc.zone_51_100_domains,
  kc.is_current,
  kc.source_fetch_id,
  kc.latest_fetch_id,
  kc.cached_at,
  kc.cache_version
FROM keywordshub_serp_zone_cache kc
JOIN keywordshub kh ON kh.keyword_id = kc.keyword_id
WHERE kc.is_current = TRUE;

COMMENT ON VIEW v_serp_zone_cache_full IS 
  'Current SERP zone cache data joined with keyword info. Shows all domains (EMD and non-EMD) per zone with is_emd_m1 flags.';


-- =====================================================
-- MIGRATION EXECUTION STEPS
-- =====================================================

-- Step 1: Execute the JSONB data migration
SELECT * FROM migrate_serp_zone_jsonb_data();

-- Expected output:
-- | migrated_rows | migrated_at           |
-- | 22            | 2025-10-17 14:45:...  |


-- Step 2: Verify migration
SELECT 
  keyword_id,
  total_emd_count,
  zone_1_emd_count,
  zone_4_10_emd_count,
  jsonb_typeof(zone_1_domains) as zone_1_type,
  zone_1_domains->'domains'->0 as sample_domain_zone_1,
  jsonb_typeof(zone_4_10_domains) as zone_4_10_type,
  zone_4_10_domains->'domains'->0 as sample_domain_zone_4_10
FROM keywordshub_serp_zone_cache
WHERE is_current = TRUE
LIMIT 5;

-- Expected output should show:
-- - zone_1_type: "object" (not "array")
-- - sample_domain has "is_emd_m1": true


-- Step 3: Test the new view
SELECT * FROM v_serp_zone_cache_full LIMIT 5;


-- =====================================================
-- MIGRATION COMPLETE
-- =====================================================
-- After successful execution:
-- 1. Update F420 API route to use new table/column names
-- 2. Update KeywordsHubTable.tsx to use new structure
-- 3. Update serpjar pclient.tsx cache queries
-- 4. Re-run F420 to populate with all domains (not just EMD)

