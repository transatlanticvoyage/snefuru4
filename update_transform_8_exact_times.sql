-- SQL to identify and update Transform #8 records with baobab_attempt_id = 8
-- Using EXACT timestamps from baobab_transform_attempts query results
--
-- Transform #8 EXACT TIMES:
-- Created:   2025-10-20 01:02:37.582447+00 
-- Started:   2025-10-20 01:02:38.722+00
-- Completed: 2025-10-20 01:06:47.641+00
-- Processed: 449,068 rows
-- Transformed: 280,527 records
-- Filter: {"release_id":3,"result_count":449068}

-- =====================================================================================
-- STEP 3: Identify records by EXACT time range + release #3 filter criteria
-- =====================================================================================

-- Time range: 01:02:37 to 01:06:48 (with 1-second buffer after completion)
WITH transform_8_exact_timerange AS (
  SELECT 
    '2025-10-20 01:02:37'::timestamp as start_time,
    '2025-10-20 01:06:48'::timestamp as end_time
)
SELECT 
    'leadsmart_transformed - exact time range' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NOT NULL) as non_null_baobab_attempt_id
FROM leadsmart_transformed, transform_8_exact_timerange
WHERE (created_at BETWEEN start_time AND end_time)
   OR (updated_at BETWEEN start_time AND end_time);

WITH transform_8_exact_timerange AS (
  SELECT 
    '2025-10-20 01:02:37'::timestamp as start_time,
    '2025-10-20 01:06:48'::timestamp as end_time
)
SELECT 
    'leadsmart_transformed_relations - exact time range' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NOT NULL) as non_null_baobab_attempt_id
FROM leadsmart_transformed_relations, transform_8_exact_timerange
WHERE (created_at BETWEEN start_time AND end_time)
   OR (updated_at BETWEEN start_time AND end_time);

-- =====================================================================================
-- Check records by release #3 filter criteria (from filter_criteria)
-- =====================================================================================

SELECT 
    'leadsmart_transformed - release 3 (all time)' as description,
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE baobab_attempt_id = 8) as already_has_attempt_8,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created
FROM leadsmart_transformed 
WHERE jrel_release_id = 3;

SELECT 
    'leadsmart_transformed_relations - via release 3 (all time)' as description,
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE r.baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE r.baobab_attempt_id = 8) as already_has_attempt_8,
    MIN(r.created_at) as earliest_created,
    MAX(r.created_at) as latest_created
FROM leadsmart_transformed_relations r
JOIN leadsmart_transformed t ON r.transformed_mundial_id = t.mundial_id
WHERE t.jrel_release_id = 3;

-- =====================================================================================
-- MOST ACCURATE: Cross-reference EXACT time range + release #3 criteria
-- =====================================================================================

-- Transform #8 candidates: Records that match BOTH exact time range AND release #3
WITH transform_8_candidates AS (
  SELECT t.mundial_id, t.city_name, t.state_code, t.created_at, t.updated_at, t.baobab_attempt_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.baobab_attempt_id IS NULL  -- Only null records (not already assigned)
    AND (
      (t.created_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp) OR
      (t.updated_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp)
    )
)
SELECT 
    'CANDIDATES - leadsmart_transformed (exact time + release 3 + null baobab_attempt_id)' as description,
    COUNT(*) as candidate_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated
FROM transform_8_candidates;

-- Check corresponding relations for these candidates
WITH transform_8_candidates AS (
  SELECT t.mundial_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.baobab_attempt_id IS NULL
    AND (
      (t.created_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp) OR
      (t.updated_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp)
    )
)
SELECT 
    'CANDIDATES - leadsmart_transformed_relations (via exact time + release 3 + null baobab_attempt_id)' as description,
    COUNT(*) as candidate_count,
    MIN(r.created_at) as earliest_created,
    MAX(r.created_at) as latest_created
FROM leadsmart_transformed_relations r
JOIN transform_8_candidates c ON r.transformed_mundial_id = c.mundial_id
WHERE r.baobab_attempt_id IS NULL;

-- =====================================================================================
-- DETAILED PREVIEW: Show sample records that will be updated
-- =====================================================================================

-- Sample of leadsmart_transformed records that will be updated
WITH transform_8_records AS (
  SELECT t.mundial_id, t.city_name, t.state_code, t.payout, t.created_at, t.updated_at, t.baobab_attempt_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.baobab_attempt_id IS NULL
    AND (
      (t.created_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp) OR
      (t.updated_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp)
    )
)
SELECT 
    'SAMPLE PREVIEW - leadsmart_transformed records to be updated' as description,
    COUNT(*) as total_records_to_update,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated
FROM transform_8_records;

-- Show first 10 sample records
WITH transform_8_records AS (
  SELECT t.mundial_id, t.city_name, t.state_code, t.payout, t.created_at, t.updated_at, t.baobab_attempt_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.baobab_attempt_id IS NULL
    AND (
      (t.created_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp) OR
      (t.updated_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp)
    )
  ORDER BY created_at
  LIMIT 10
)
SELECT * FROM transform_8_records;

-- =====================================================================================
-- FINAL COUNT VERIFICATION BEFORE UPDATES
-- =====================================================================================
-- This should show approximately 280,527 records (the transformed count from Transform #8)

SELECT 'FINAL COUNT VERIFICATION' as check_type,
       COUNT(*) as records_in_leadsmart_transformed_to_update
FROM leadsmart_transformed t
WHERE t.jrel_release_id = 3
  AND t.baobab_attempt_id IS NULL
  AND (
    (t.created_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp) OR
    (t.updated_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp)
  );

WITH transform_8_transformed AS (
  SELECT t.mundial_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.baobab_attempt_id IS NULL
    AND (
      (t.created_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp) OR
      (t.updated_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp)
    )
)
SELECT 'FINAL COUNT VERIFICATION' as check_type,
       COUNT(*) as records_in_leadsmart_transformed_relations_to_update
FROM leadsmart_transformed_relations r
JOIN transform_8_transformed t8 ON r.transformed_mundial_id = t8.mundial_id
WHERE r.baobab_attempt_id IS NULL;

-- =====================================================================================
-- ACTUAL UPDATE STATEMENTS 
-- =====================================================================================
-- IMPORTANT: Only run these after reviewing all the counts above!
-- The counts should approximately match Transform #8's 280,527 transformed records

/*
-- Step 1: Update leadsmart_transformed table
UPDATE leadsmart_transformed 
SET baobab_attempt_id = 8
WHERE jrel_release_id = 3
  AND baobab_attempt_id IS NULL
  AND (
    (created_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp) OR
    (updated_at BETWEEN '2025-10-20 01:02:37'::timestamp AND '2025-10-20 01:06:48'::timestamp)
  );

-- Step 2: Update leadsmart_transformed_relations table
WITH transform_8_transformed AS (
  SELECT t.mundial_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.baobab_attempt_id = 8  -- Now they should have baobab_attempt_id = 8 from Step 1
)
UPDATE leadsmart_transformed_relations 
SET baobab_attempt_id = 8
FROM transform_8_transformed t8
WHERE leadsmart_transformed_relations.transformed_mundial_id = t8.mundial_id
  AND leadsmart_transformed_relations.baobab_attempt_id IS NULL;
*/

-- =====================================================================================
-- POST-UPDATE VERIFICATION (Run after the updates above)
-- =====================================================================================

-- Verify the updates worked - should show ~280,527 records with baobab_attempt_id = 8
SELECT 
    'POST-UPDATE VERIFICATION - leadsmart_transformed' as description,
    COUNT(*) as records_with_baobab_attempt_id_8
FROM leadsmart_transformed 
WHERE baobab_attempt_id = 8;

SELECT 
    'POST-UPDATE VERIFICATION - leadsmart_transformed_relations' as description,
    COUNT(*) as records_with_baobab_attempt_id_8
FROM leadsmart_transformed_relations 
WHERE baobab_attempt_id = 8;

-- Check for any remaining null values in release #3 data
SELECT 
    'POST-UPDATE CHECK - Remaining nulls in release 3' as description,
    COUNT(*) as remaining_null_count
FROM leadsmart_transformed 
WHERE jrel_release_id = 3 AND baobab_attempt_id IS NULL;

-- Final summary of all baobab_attempt_id assignments
SELECT 
    'FINAL SUMMARY - leadsmart_transformed by baobab_attempt_id' as summary_type,
    baobab_attempt_id,
    COUNT(*) as record_count
FROM leadsmart_transformed 
WHERE baobab_attempt_id IS NOT NULL
GROUP BY baobab_attempt_id
ORDER BY baobab_attempt_id;

SELECT 
    'FINAL SUMMARY - leadsmart_transformed_relations by baobab_attempt_id' as summary_type,
    baobab_attempt_id,
    COUNT(*) as record_count
FROM leadsmart_transformed_relations 
WHERE baobab_attempt_id IS NOT NULL
GROUP BY baobab_attempt_id
ORDER BY baobab_attempt_id;