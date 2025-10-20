-- Investigate Transform #8 Records - Why time-based queries return 0 results
-- Let's focus on the release #3 filter criteria and investigate time patterns

-- =====================================================================================
-- STEP 1: Investigate all release #3 records (ignore time for now)
-- =====================================================================================

-- Check all records with jrel_release_id = 3 (Transform #8's filter criteria)
SELECT 
    'All leadsmart_transformed records with release_id = 3' as description,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NOT NULL) as non_null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE baobab_attempt_id = 8) as already_has_attempt_8,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated
FROM leadsmart_transformed 
WHERE jrel_release_id = 3;

-- Check corresponding relations
SELECT 
    'All leadsmart_transformed_relations via release_id = 3' as description,
    COUNT(*) as total_count,
    COUNT(*) FILTER (WHERE r.baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE r.baobab_attempt_id IS NOT NULL) as non_null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE r.baobab_attempt_id = 8) as already_has_attempt_8,
    MIN(r.created_at) as earliest_created,
    MAX(r.created_at) as latest_created,
    MIN(r.updated_at) as earliest_updated,
    MAX(r.updated_at) as latest_updated
FROM leadsmart_transformed_relations r
JOIN leadsmart_transformed t ON r.transformed_mundial_id = t.mundial_id
WHERE t.jrel_release_id = 3;

-- =====================================================================================
-- STEP 2: Check if there are ANY records in the Transform #8 time window
-- =====================================================================================

-- Look for ANY records (not just release #3) in the Transform #8 time window
SELECT 
    'ANY leadsmart_transformed records in Transform 8 time window' as description,
    COUNT(*) as total_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated
FROM leadsmart_transformed 
WHERE (created_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp)
   OR (updated_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp);

SELECT 
    'ANY leadsmart_transformed_relations records in Transform 8 time window' as description,
    COUNT(*) as total_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated
FROM leadsmart_transformed_relations 
WHERE (created_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp)
   OR (updated_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp);

-- =====================================================================================
-- STEP 3: Expand time window to see if records exist nearby
-- =====================================================================================

-- Check 30 minutes before and after Transform #8 time window
SELECT 
    'leadsmart_transformed in EXPANDED time window (30 min before/after)' as description,
    COUNT(*) as total_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated
FROM leadsmart_transformed 
WHERE (created_at BETWEEN '2025-10-20 00:32:37'::timestamp AND '2025-10-20 01:36:48'::timestamp)
   OR (updated_at BETWEEN '2025-10-20 00:32:37'::timestamp AND '2025-10-20 01:36:48'::timestamp);

-- =====================================================================================
-- STEP 4: Check general time patterns in the database
-- =====================================================================================

-- Show distribution of created_at times for all records (to understand time patterns)
SELECT 
    'leadsmart_transformed time distribution' as table_name,
    DATE_TRUNC('hour', created_at) as hour_bucket,
    COUNT(*) as record_count
FROM leadsmart_transformed 
WHERE created_at >= '2025-10-19 00:00:00'::timestamp 
  AND created_at <= '2025-10-21 00:00:00'::timestamp
GROUP BY DATE_TRUNC('hour', created_at)
ORDER BY hour_bucket;

-- =====================================================================================
-- STEP 5: Alternative identification strategy - Use row counts
-- =====================================================================================

-- If time-based approach fails, we need alternative approach
-- Transform #8 processed 449,068 rows and transformed 280,527 records
-- Look for the largest group of NULL baobab_attempt_id records in release #3

-- Count NULL baobab_attempt_id records by release
SELECT 
    'NULL baobab_attempt_id records by release' as analysis_type,
    jrel_release_id,
    COUNT(*) as null_records_count
FROM leadsmart_transformed 
WHERE baobab_attempt_id IS NULL
GROUP BY jrel_release_id
ORDER BY null_records_count DESC;

-- =====================================================================================
-- STEP 6: Sample records for manual inspection
-- =====================================================================================

-- Show sample records from release #3 with NULL baobab_attempt_id
SELECT 
    'Sample release 3 records with NULL baobab_attempt_id' as sample_type,
    mundial_id,
    city_name,
    state_code,
    created_at,
    updated_at,
    baobab_attempt_id
FROM leadsmart_transformed 
WHERE jrel_release_id = 3 
  AND baobab_attempt_id IS NULL
ORDER BY created_at DESC
LIMIT 20;

-- =====================================================================================
-- STEP 7: Check for Transform #8 records that might already be assigned
-- =====================================================================================

-- Maybe Transform #8 records already have baobab_attempt_id assigned?
SELECT 
    'Records already with baobab_attempt_id = 8' as check_type,
    COUNT(*) as records_with_attempt_8
FROM leadsmart_transformed 
WHERE baobab_attempt_id = 8;

-- Check if these are release #3 records
SELECT 
    'baobab_attempt_id = 8 records by release' as analysis_type,
    jrel_release_id,
    COUNT(*) as record_count
FROM leadsmart_transformed 
WHERE baobab_attempt_id = 8
GROUP BY jrel_release_id
ORDER BY jrel_release_id;

-- =====================================================================================
-- STEP 8: Final recommendation based on findings
-- =====================================================================================

-- If release #3 has a large number of NULL baobab_attempt_id records (~280,527)
-- and there are no existing records with baobab_attempt_id = 8,
-- then we can safely assume these are the Transform #8 records

SELECT 
    'SUMMARY for decision making' as summary_type,
    'release_3_null_count' as metric,
    COUNT(*) as value
FROM leadsmart_transformed 
WHERE jrel_release_id = 3 AND baobab_attempt_id IS NULL

UNION ALL

SELECT 
    'SUMMARY for decision making' as summary_type,
    'existing_attempt_8_count' as metric,
    COUNT(*) as value
FROM leadsmart_transformed 
WHERE baobab_attempt_id = 8

UNION ALL

SELECT 
    'SUMMARY for decision making' as summary_type,
    'total_release_3_count' as metric,
    COUNT(*) as value
FROM leadsmart_transformed 
WHERE jrel_release_id = 3;

-- =====================================================================================
-- RECOMMENDED UPDATE STRATEGY (if investigation confirms these are Transform #8 records)
-- =====================================================================================

/*
-- If the investigation above shows:
-- 1. ~280,527 records in release #3 with NULL baobab_attempt_id
-- 2. No existing records with baobab_attempt_id = 8
-- 3. No records found in the exact time window
--
-- Then we can safely update ALL release #3 NULL records as Transform #8:

-- Step 1: Update leadsmart_transformed
UPDATE leadsmart_transformed 
SET baobab_attempt_id = 8
WHERE jrel_release_id = 3
  AND baobab_attempt_id IS NULL;

-- Step 2: Update corresponding leadsmart_transformed_relations
UPDATE leadsmart_transformed_relations 
SET baobab_attempt_id = 8
FROM leadsmart_transformed t
WHERE leadsmart_transformed_relations.transformed_mundial_id = t.mundial_id
  AND t.jrel_release_id = 3
  AND t.baobab_attempt_id = 8  -- Now assigned from Step 1
  AND leadsmart_transformed_relations.baobab_attempt_id IS NULL;
*/