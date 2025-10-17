-- =====================================================
-- RANKING ZONES SYSTEM - FINAL SCHEMA
-- =====================================================
-- Run this SQL in Supabase to create all required tables
-- 
-- Table Names (FINAL):
-- 1. ranking_zones
-- 2. keywordshub_emd_zone_cache
-- 3. relations_keywordshub_results_zones
-- 
-- Column: emd_stamp_method (not emd_method)
-- =====================================================

-- =====================================================
-- TABLE 1: ranking_zones (Reference table - 7 rows)
-- =====================================================

CREATE TABLE IF NOT EXISTS ranking_zones (
  zone_id SERIAL PRIMARY KEY,
  zone_key VARCHAR(10) NOT NULL UNIQUE,
  zone_name VARCHAR(50) NOT NULL,
  min_rank INTEGER NOT NULL,
  max_rank INTEGER NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE ranking_zones IS 'Defines the 7 ranking zones for SERP analysis (1, 2, 3, 4-10, 11-25, 26-50, 51-100)';
COMMENT ON COLUMN ranking_zones.zone_key IS 'Used in queries and cache column names (e.g., zone_4_10_count)';
COMMENT ON COLUMN ranking_zones.display_order IS 'Controls UI column ordering (1-7)';

-- Insert the 7 ranking zones
INSERT INTO ranking_zones (zone_key, zone_name, min_rank, max_rank, display_order) VALUES
  ('1', 'Position 1', 1, 1, 1),
  ('2', 'Position 2', 2, 2, 2),
  ('3', 'Position 3', 3, 3, 3),
  ('4_10', 'Positions 4-10', 4, 10, 4),
  ('11_25', 'Positions 11-25', 11, 25, 5),
  ('26_50', 'Positions 26-50', 26, 50, 6),
  ('51_100', 'Positions 51-100', 51, 100, 7)
ON CONFLICT (zone_key) DO NOTHING;

-- =====================================================
-- TABLE 2: keywordshub_emd_zone_cache
-- =====================================================
-- Cache table: 1 row per keyword per EMD stamp method
-- Stores pre-aggregated counts and top domains per zone

CREATE TABLE IF NOT EXISTS keywordshub_emd_zone_cache (
  cache_id SERIAL PRIMARY KEY,
  keyword_id INTEGER NOT NULL REFERENCES keywordshub(keyword_id) ON DELETE CASCADE,
  emd_stamp_method VARCHAR(50) NOT NULL,
  latest_fetch_id INTEGER REFERENCES zhe_serp_fetches(fetch_id) ON DELETE SET NULL,
  
  -- SET 1: COUNT COLUMNS (8 columns)
  total_emd_sites INTEGER DEFAULT 0,
  zone_1_count INTEGER DEFAULT 0,
  zone_2_count INTEGER DEFAULT 0,
  zone_3_count INTEGER DEFAULT 0,
  zone_4_10_count INTEGER DEFAULT 0,
  zone_11_25_count INTEGER DEFAULT 0,
  zone_26_50_count INTEGER DEFAULT 0,
  zone_51_100_count INTEGER DEFAULT 0,
  
  -- SET 2: DOMAIN COLUMNS (7 columns - JSONB arrays)
  zone_1_domains JSONB,
  zone_2_domains JSONB,
  zone_3_domains JSONB,
  zone_4_10_domains JSONB,
  zone_11_25_domains JSONB,
  zone_26_50_domains JSONB,
  zone_51_100_domains JSONB,
  
  -- Metadata
  cached_at TIMESTAMP DEFAULT NOW(),
  cache_version INTEGER DEFAULT 1,
  
  -- One cache row per keyword per method
  UNIQUE (keyword_id, emd_stamp_method)
);

COMMENT ON TABLE keywordshub_emd_zone_cache IS 'Fast cache for UI display. Pre-aggregated EMD match counts and top domains per ranking zone.';
COMMENT ON COLUMN keywordshub_emd_zone_cache.emd_stamp_method IS 'EMD detection method: method-1, method-2, etc. Future support for multiple detection algorithms.';
COMMENT ON COLUMN keywordshub_emd_zone_cache.latest_fetch_id IS 'Tracks which SERP fetch was used to build this cache. Used for cache invalidation.';
COMMENT ON COLUMN keywordshub_emd_zone_cache.total_emd_sites IS 'Total EMD matches across all zones';
COMMENT ON COLUMN keywordshub_emd_zone_cache.zone_1_domains IS 'JSONB array: [{"domain": "example.com", "rank": 1, "result_id": 123}]';

-- Indexes for performance
CREATE INDEX idx_kemd_keyword_id ON keywordshub_emd_zone_cache(keyword_id);
CREATE INDEX idx_kemd_emd_stamp_method ON keywordshub_emd_zone_cache(emd_stamp_method);
CREATE INDEX idx_kemd_total_emd_sites ON keywordshub_emd_zone_cache(total_emd_sites);
CREATE INDEX idx_kemd_cached_at ON keywordshub_emd_zone_cache(cached_at);
CREATE INDEX idx_kemd_latest_fetch_id ON keywordshub_emd_zone_cache(latest_fetch_id);

-- GIN indexes for JSONB columns (for searching within domain arrays)
CREATE INDEX idx_kemd_zone_1_domains_gin ON keywordshub_emd_zone_cache USING GIN(zone_1_domains);
CREATE INDEX idx_kemd_zone_4_10_domains_gin ON keywordshub_emd_zone_cache USING GIN(zone_4_10_domains);
CREATE INDEX idx_kemd_zone_11_25_domains_gin ON keywordshub_emd_zone_cache USING GIN(zone_11_25_domains);

-- =====================================================
-- TABLE 3: relations_keywordshub_results_zones
-- =====================================================
-- Relations table: Stores which SERP results are EMD matches
-- Only stores EMD matches (not all 98 SERP results)
-- Enables drill-down and historical tracking

CREATE TABLE IF NOT EXISTS relations_keywordshub_results_zones (
  relation_id SERIAL PRIMARY KEY,
  
  -- Core relationships (FKs only)
  keyword_id INTEGER NOT NULL REFERENCES keywordshub(keyword_id) ON DELETE CASCADE,
  result_id INTEGER NOT NULL REFERENCES zhe_serp_results(result_id) ON DELETE CASCADE,
  zone_id INTEGER NOT NULL REFERENCES ranking_zones(zone_id) ON DELETE CASCADE,
  
  -- Method identifier
  emd_stamp_method VARCHAR(50) NOT NULL,
  
  -- Metadata
  created_at TIMESTAMP DEFAULT NOW()
);

COMMENT ON TABLE relations_keywordshub_results_zones IS 'Stores granular EMD match relationships. Only stores matches (not all SERP results). Supports multiple detection methods.';
COMMENT ON COLUMN relations_keywordshub_results_zones.emd_stamp_method IS 'EMD detection method used: method-1, method-2, etc. Same result can match multiple methods.';

-- Indexes for performance
CREATE INDEX idx_rkrz_keyword_id ON relations_keywordshub_results_zones(keyword_id);
CREATE INDEX idx_rkrz_result_id ON relations_keywordshub_results_zones(result_id);
CREATE INDEX idx_rkrz_zone_id ON relations_keywordshub_results_zones(zone_id);
CREATE INDEX idx_rkrz_emd_stamp_method ON relations_keywordshub_results_zones(emd_stamp_method);

-- Composite indexes for common query patterns
CREATE INDEX idx_rkrz_keyword_method ON relations_keywordshub_results_zones(keyword_id, emd_stamp_method);
CREATE INDEX idx_rkrz_keyword_zone_method ON relations_keywordshub_results_zones(keyword_id, zone_id, emd_stamp_method);

-- Unique constraint: same result can match multiple methods, but only once per method per zone
CREATE UNIQUE INDEX idx_rkrz_result_zone_method_unique ON relations_keywordshub_results_zones(result_id, zone_id, emd_stamp_method);

-- =====================================================
-- HELPER FUNCTIONS
-- =====================================================

-- Function to determine zone_id from rank position
CREATE OR REPLACE FUNCTION get_zone_id_from_rank(rank_position INTEGER)
RETURNS INTEGER AS $$
DECLARE
  result_zone_id INTEGER;
BEGIN
  SELECT zone_id INTO result_zone_id
  FROM ranking_zones
  WHERE rank_position >= min_rank AND rank_position <= max_rank
  LIMIT 1;
  
  RETURN result_zone_id;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION get_zone_id_from_rank IS 'Determines which zone a SERP result belongs to based on its rank position';

-- Function to clear cache and relations for a keyword
CREATE OR REPLACE FUNCTION clear_keyword_emd_data(target_keyword_id INTEGER, target_method VARCHAR(50) DEFAULT NULL)
RETURNS VOID AS $$
BEGIN
  IF target_method IS NULL THEN
    -- Clear all methods
    DELETE FROM keywordshub_emd_zone_cache WHERE keyword_id = target_keyword_id;
    DELETE FROM relations_keywordshub_results_zones WHERE keyword_id = target_keyword_id;
  ELSE
    -- Clear specific method only
    DELETE FROM keywordshub_emd_zone_cache WHERE keyword_id = target_keyword_id AND emd_stamp_method = target_method;
    DELETE FROM relations_keywordshub_results_zones WHERE keyword_id = target_keyword_id AND emd_stamp_method = target_method;
  END IF;
END;
$$ LANGUAGE plpgsql;

COMMENT ON FUNCTION clear_keyword_emd_data IS 'Clears cache and relations for a keyword. If method not specified, clears all methods.';

-- =====================================================
-- USEFUL VIEWS
-- =====================================================

-- View: Full details of EMD matches with joined data
CREATE OR REPLACE VIEW v_emd_matches_full AS
SELECT 
  r.relation_id,
  r.keyword_id,
  k.keyword_datum,
  r.result_id,
  zsr.domain,
  zsr.rank_absolute,
  zsr.url,
  zsr.title,
  zsr.rel_fetch_id as fetch_id,
  zsf.created_at as fetch_date,
  r.zone_id,
  rz.zone_key,
  rz.zone_name,
  rz.min_rank,
  rz.max_rank,
  r.emd_stamp_method,
  r.created_at as relation_created_at
FROM relations_keywordshub_results_zones r
JOIN keywordshub k ON k.keyword_id = r.keyword_id
JOIN zhe_serp_results zsr ON zsr.result_id = r.result_id
JOIN zhe_serp_fetches zsf ON zsf.fetch_id = zsr.rel_fetch_id
JOIN ranking_zones rz ON rz.zone_id = r.zone_id;

COMMENT ON VIEW v_emd_matches_full IS 'Full view of EMD matches with all joined data. Use for drill-down and reporting.';

-- =====================================================
-- EXAMPLE USAGE QUERIES
-- =====================================================

-- Query 1: Get all EMD matches for a keyword (method-1)
-- SELECT * FROM v_emd_matches_full 
-- WHERE keyword_id = 1832 AND emd_stamp_method = 'method-1'
-- ORDER BY rank_absolute;

-- Query 2: Get EMD matches in zone 4-10 for a keyword
-- SELECT domain, rank_absolute, zone_name
-- FROM v_emd_matches_full
-- WHERE keyword_id = 1832 AND zone_key = '4_10' AND emd_stamp_method = 'method-1'
-- ORDER BY rank_absolute;

-- Query 3: Get cached data for UI display (1000 keywords, method-1 only)
-- SELECT 
--   k.keyword_id,
--   k.keyword_datum,
--   c.total_emd_sites,
--   c.zone_1_count,
--   c.zone_1_domains,
--   -- ... all other zone columns
--   c.cached_at
-- FROM keywordshub k
-- LEFT JOIN keywordshub_emd_zone_cache c ON (
--   c.keyword_id = k.keyword_id AND c.emd_stamp_method = 'method-1'
-- )
-- WHERE k.keyword_tag_id = 17
-- ORDER BY k.keyword_id;

-- Query 4: Check cache staleness (keywords with no cache or old cache)
-- SELECT 
--   k.keyword_id,
--   k.keyword_datum,
--   c.cached_at,
--   c.latest_fetch_id,
--   zsf.fetch_id as newest_fetch_id,
--   CASE 
--     WHEN c.cache_id IS NULL THEN 'NO_CACHE'
--     WHEN c.latest_fetch_id != zsf.fetch_id THEN 'STALE_CACHE'
--     ELSE 'CURRENT'
--   END as cache_status
-- FROM keywordshub k
-- LEFT JOIN keywordshub_emd_zone_cache c ON (
--   c.keyword_id = k.keyword_id AND c.emd_stamp_method = 'method-1'
-- )
-- LEFT JOIN LATERAL (
--   SELECT fetch_id FROM zhe_serp_fetches
--   WHERE rel_keyword_id = k.keyword_id
--   ORDER BY created_at DESC LIMIT 1
-- ) zsf ON TRUE
-- WHERE k.keyword_tag_id = 17;

-- Query 5: Clear stale cache for a keyword
-- SELECT clear_keyword_emd_data(1832, 'method-1');

-- =====================================================
-- VERIFICATION QUERIES (Run after migration)
-- =====================================================

-- Check that all tables were created
-- SELECT table_name FROM information_schema.tables 
-- WHERE table_schema = 'public' 
--   AND table_name IN ('ranking_zones', 'keywordshub_emd_zone_cache', 'relations_keywordshub_results_zones');

-- Check that ranking_zones has 7 rows
-- SELECT COUNT(*) as zone_count FROM ranking_zones;
-- Expected: 7

-- Check that all indexes were created
-- SELECT indexname FROM pg_indexes 
-- WHERE tablename IN ('keywordshub_emd_zone_cache', 'relations_keywordshub_results_zones')
-- ORDER BY tablename, indexname;

-- =====================================================
-- END OF SCHEMA
-- =====================================================
