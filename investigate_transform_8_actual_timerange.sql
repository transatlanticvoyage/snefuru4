-- Investigate Transform #8 Records - Using ACTUAL time window from baobab_transform_attempts
-- Transform #8: started_at: 2025-10-20 01:02:38.722+00, completed_at: 2025-10-20 01:06:47.641+00
-- Transform #44: started_at: 2025-10-20 12:16:45.675+00, completed_at: 2025-10-20 12:29:23.434+00
-- (The 12:26 PM records have baobab_attempt_id = 44, not 8)

-- =====================================================================================
-- STEP 1: Check if Transform #8 records already have baobab_attempt_id = 8
-- =====================================================================================

-- Check existing records with baobab_attempt_id = 8
SELECT 
    'Records already with baobab_attempt_id = 8' as description,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated
FROM leadsmart_transformed 
WHERE baobab_attempt_id = 8;

-- Check release distribution for baobab_attempt_id = 8
SELECT 
    'baobab_attempt_id = 8 by release' as analysis_type,
    jrel_release_id,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created
FROM leadsmart_transformed 
WHERE baobab_attempt_id = 8
GROUP BY jrel_release_id
ORDER BY jrel_release_id;

-- Sample records with baobab_attempt_id = 8
SELECT 
    'Sample baobab_attempt_id = 8 records' as sample_type,
    mundial_id,
    city_name,
    state_code,
    jrel_release_id,
    created_at,
    updated_at,
    baobab_attempt_id
FROM leadsmart_transformed 
WHERE baobab_attempt_id = 8
ORDER BY created_at
LIMIT 10;

-- =====================================================================================
-- STEP 2: Check Transform #8 EXACT time window (1:02-1:06 AM)
-- =====================================================================================

-- Transform #8 exact time window: 01:02:38 to 01:06:47
SELECT 
    'Transform 8 exact time window - leadsmart_transformed' as description,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE baobab_attempt_id = 8) as already_has_attempt_8,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NOT NULL AND baobab_attempt_id != 8) as other_baobab_attempt_id
FROM leadsmart_transformed 
WHERE (created_at BETWEEN '2025-10-20 01:02:38'::timestamp AND '2025-10-20 01:06:47'::timestamp)
   OR (updated_at BETWEEN '2025-10-20 01:02:38'::timestamp AND '2025-10-20 01:06:47'::timestamp);

-- Check release #3 records in Transform #8 time window
SELECT 
    'Transform 8 time window + release 3 - leadsmart_transformed' as description,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE baobab_attempt_id = 8) as already_has_attempt_8,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NOT NULL AND baobab_attempt_id != 8) as other_baobab_attempt_id
FROM leadsmart_transformed 
WHERE jrel_release_id = 3
  AND ((created_at BETWEEN '2025-10-20 01:02:38'::timestamp AND '2025-10-20 01:06:47'::timestamp)
    OR (updated_at BETWEEN '2025-10-20 01:02:38'::timestamp AND '2025-10-20 01:06:47'::timestamp));

-- Sample records from Transform #8 time window
SELECT 
    'Sample Transform 8 time window records' as sample_type,
    mundial_id,
    city_name,
    state_code,
    jrel_release_id,
    created_at,
    updated_at,
    baobab_attempt_id
FROM leadsmart_transformed 
WHERE (created_at BETWEEN '2025-10-20 01:02:38'::timestamp AND '2025-10-20 01:06:47'::timestamp)
   OR (updated_at BETWEEN '2025-10-20 01:02:38'::timestamp AND '2025-10-20 01:06:47'::timestamp)
ORDER BY created_at
LIMIT 10;

-- =====================================================================================
-- STEP 3: Check leadsmart_transformed_relations for Transform #8
-- =====================================================================================

-- Check relations with baobab_attempt_id = 8
SELECT 
    'leadsmart_transformed_relations with baobab_attempt_id = 8' as description,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created
FROM leadsmart_transformed_relations 
WHERE baobab_attempt_id = 8;

-- Check relations in Transform #8 time window
SELECT 
    'Transform 8 time window - leadsmart_transformed_relations' as description,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE baobab_attempt_id = 8) as already_has_attempt_8,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NOT NULL AND baobab_attempt_id != 8) as other_baobab_attempt_id
FROM leadsmart_transformed_relations 
WHERE (created_at BETWEEN '2025-10-20 01:02:38'::timestamp AND '2025-10-20 01:06:47'::timestamp)
   OR (updated_at BETWEEN '2025-10-20 01:02:38'::timestamp AND '2025-10-20 01:06:47'::timestamp);

-- =====================================================================================
-- STEP 4: Expanded time window investigation
-- =====================================================================================

-- Check 30 minutes before and after Transform #8 time window
SELECT 
    'EXPANDED time window (30 min before/after Transform 8)' as description,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    COUNT(*) FILTER (WHERE jrel_release_id = 3) as release_3_count,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE baobab_attempt_id = 8) as already_has_attempt_8
FROM leadsmart_transformed 
WHERE (created_at BETWEEN '2025-10-20 00:32:38'::timestamp AND '2025-10-20 01:36:47'::timestamp)
   OR (updated_at BETWEEN '2025-10-20 00:32:38'::timestamp AND '2025-10-20 01:36:47'::timestamp);

-- =====================================================================================
-- STEP 5: Alternative approach - Check for NULL records in release #3
-- =====================================================================================

-- Maybe Transform #8 records are simply all remaining NULL records in release #3?
-- Check total NULL baobab_attempt_id records by release
SELECT 
    'NULL baobab_attempt_id records by release' as analysis_type,
    jrel_release_id,
    COUNT(*) as null_records_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created
FROM leadsmart_transformed 
WHERE baobab_attempt_id IS NULL
GROUP BY jrel_release_id
ORDER BY null_records_count DESC;

-- Check if release #3 has exactly 280,527 NULL records (Transform #8's row count)
SELECT 
    'Release 3 NULL baobab_attempt_id count' as check_type,
    COUNT(*) as null_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created
FROM leadsmart_transformed 
WHERE jrel_release_id = 3 
  AND baobab_attempt_id IS NULL;

-- =====================================================================================
-- SUMMARY FOR DECISION MAKING
-- =====================================================================================

SELECT 
    'DECISION SUMMARY' as summary_type,
    'existing_baobab_attempt_id_8_count' as metric,
    COUNT(*) as value
FROM leadsmart_transformed 
WHERE baobab_attempt_id = 8

UNION ALL

SELECT 
    'DECISION SUMMARY' as summary_type,
    'release_3_null_count' as metric,
    COUNT(*) as value
FROM leadsmart_transformed 
WHERE jrel_release_id = 3 AND baobab_attempt_id IS NULL

UNION ALL

SELECT 
    'DECISION SUMMARY' as summary_type,
    'total_release_3_count' as metric,
    COUNT(*) as value
FROM leadsmart_transformed 
WHERE jrel_release_id = 3;

-- =====================================================================================
-- CONCLUSION AND NEXT STEPS
-- =====================================================================================
-- Based on the results above, we can determine:
-- 1. If records with baobab_attempt_id = 8 already exist, Transform #8 was already processed
-- 2. If no records exist in the exact time window, but release #3 has ~280,527 NULL records,
--    then those NULL records are likely the Transform #8 records that need to be updated
-- 3. If neither of the above, we need to investigate further