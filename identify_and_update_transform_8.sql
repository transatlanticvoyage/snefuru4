-- SQL to identify and update Transform #8 records with baobab_attempt_id = 8
-- Transform #8: Started 10/19/2025 9:02:37 PM, Duration 4m 8s, 280,527 records

-- =====================================================================================
-- STEP 1: Get exact timestamps from baobab_transform_attempts table
-- =====================================================================================

-- First, let's see the exact timestamps for Transform #8
SELECT 
    baobab_attempt_id,
    status,
    created_at,
    started_at,
    completed_at,
    rows_processed,
    rows_transformed,
    filter_criteria,
    TO_CHAR(created_at, 'MM/DD/YYYY HH12:MI:SS AM') as created_formatted,
    TO_CHAR(started_at, 'MM/DD/YYYY HH12:MI:SS AM') as started_formatted,
    TO_CHAR(completed_at, 'MM/DD/YYYY HH12:MI:SS AM') as completed_formatted
FROM baobab_transform_attempts 
WHERE baobab_attempt_id = 8;

-- =====================================================================================
-- STEP 2: Identify time range for Transform #8 records
-- =====================================================================================

-- Based on your info: Started 10/19/2025 9:02:37 PM, Duration 4m 8s
-- Approximate time range: 2025-10-19 21:02:37 to 2025-10-19 21:06:45

-- Let's check what records exist in this time range
WITH transform_8_timerange AS (
  SELECT 
    '2025-10-19 21:02:00'::timestamp as start_time,
    '2025-10-19 21:07:00'::timestamp as end_time
)
SELECT 
    'leadsmart_transformed' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated
FROM leadsmart_transformed, transform_8_timerange
WHERE (created_at BETWEEN start_time AND end_time)
   OR (updated_at BETWEEN start_time AND end_time)

UNION ALL

SELECT 
    'leadsmart_transformed_relations' as table_name,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated
FROM leadsmart_transformed_relations, transform_8_timerange
WHERE (created_at BETWEEN start_time AND end_time)
   OR (updated_at BETWEEN start_time AND end_time);

-- =====================================================================================
-- STEP 3: Identify records by release #3 filter criteria
-- =====================================================================================

-- Transform #8 was for "release #3", so let's find records with jrel_release_id = 3
SELECT 
    'leadsmart_transformed - release 3' as description,
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE baobab_attempt_id = 8) as already_has_attempt_8
FROM leadsmart_transformed 
WHERE jrel_release_id = 3;

SELECT 
    'leadsmart_transformed_relations - via release 3' as description,
    COUNT(*) as record_count,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE baobab_attempt_id = 8) as already_has_attempt_8
FROM leadsmart_transformed_relations r
JOIN leadsmart_transformed t ON r.transformed_mundial_id = t.mundial_id
WHERE t.jrel_release_id = 3;

-- =====================================================================================
-- STEP 4: Cross-reference with time range + release criteria
-- =====================================================================================

-- Most accurate approach: Records that match BOTH time range AND release #3
WITH transform_8_candidates AS (
  SELECT DISTINCT t.mundial_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.baobab_attempt_id IS NULL  -- Only null records (not already assigned)
    AND (
      (t.created_at BETWEEN '2025-10-19 21:02:00'::timestamp AND '2025-10-19 21:07:00'::timestamp) OR
      (t.updated_at BETWEEN '2025-10-19 21:02:00'::timestamp AND '2025-10-19 21:07:00'::timestamp)
    )
)
SELECT 
    'Transform 8 Candidates - leadsmart_transformed' as description,
    COUNT(*) as candidate_count
FROM transform_8_candidates;

-- Check corresponding relations
WITH transform_8_candidates AS (
  SELECT DISTINCT t.mundial_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.baobab_attempt_id IS NULL
    AND (
      (t.created_at BETWEEN '2025-10-19 21:02:00'::timestamp AND '2025-10-19 21:07:00'::timestamp) OR
      (t.updated_at BETWEEN '2025-10-19 21:02:00'::timestamp AND '2025-10-19 21:07:00'::timestamp)
    )
)
SELECT 
    'Transform 8 Candidates - leadsmart_transformed_relations' as description,
    COUNT(*) as candidate_count
FROM leadsmart_transformed_relations r
JOIN transform_8_candidates c ON r.transformed_mundial_id = c.mundial_id
WHERE r.baobab_attempt_id IS NULL;

-- =====================================================================================
-- STEP 5: PREVIEW what will be updated (DRY RUN)
-- =====================================================================================

-- Preview leadsmart_transformed records that will be updated
WITH transform_8_records AS (
  SELECT t.mundial_id, t.city_name, t.state_code, t.created_at, t.updated_at
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.baobab_attempt_id IS NULL
    AND (
      (t.created_at BETWEEN '2025-10-19 21:02:00'::timestamp AND '2025-10-19 21:07:00'::timestamp) OR
      (t.updated_at BETWEEN '2025-10-19 21:02:00'::timestamp AND '2025-10-19 21:07:00'::timestamp)
    )
)
SELECT 
    'PREVIEW - leadsmart_transformed updates' as description,
    COUNT(*) as records_to_update,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    MIN(updated_at) as earliest_updated,
    MAX(updated_at) as latest_updated
FROM transform_8_records;

-- Preview leadsmart_transformed_relations records that will be updated
WITH transform_8_transformed AS (
  SELECT t.mundial_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.baobab_attempt_id IS NULL
    AND (
      (t.created_at BETWEEN '2025-10-19 21:02:00'::timestamp AND '2025-10-19 21:07:00'::timestamp) OR
      (t.updated_at BETWEEN '2025-10-19 21:02:00'::timestamp AND '2025-10-19 21:07:00'::timestamp)
    )
)
SELECT 
    'PREVIEW - leadsmart_transformed_relations updates' as description,
    COUNT(*) as records_to_update,
    MIN(r.created_at) as earliest_created,
    MAX(r.created_at) as latest_created
FROM leadsmart_transformed_relations r
JOIN transform_8_transformed t8 ON r.transformed_mundial_id = t8.mundial_id
WHERE r.baobab_attempt_id IS NULL;

-- =====================================================================================
-- STEP 6: ACTUAL UPDATE STATEMENTS (Run these after reviewing previews above)
-- =====================================================================================

/*
-- IMPORTANT: Only run these UPDATE statements after reviewing the PREVIEW results above!
-- Make sure the counts match expectations (~280,527 records)

-- Update leadsmart_transformed table
UPDATE leadsmart_transformed 
SET baobab_attempt_id = 8
WHERE jrel_release_id = 3
  AND baobab_attempt_id IS NULL
  AND (
    (created_at BETWEEN '2025-10-19 21:02:00'::timestamp AND '2025-10-19 21:07:00'::timestamp) OR
    (updated_at BETWEEN '2025-10-19 21:02:00'::timestamp AND '2025-10-19 21:07:00'::timestamp)
  );

-- Update leadsmart_transformed_relations table
WITH transform_8_transformed AS (
  SELECT t.mundial_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.baobab_attempt_id = 8  -- Now they should have baobab_attempt_id = 8 from above update
)
UPDATE leadsmart_transformed_relations 
SET baobab_attempt_id = 8
FROM transform_8_transformed t8
WHERE leadsmart_transformed_relations.transformed_mundial_id = t8.mundial_id
  AND leadsmart_transformed_relations.baobab_attempt_id IS NULL;
*/

-- =====================================================================================
-- STEP 7: Verification after updates
-- =====================================================================================

-- Verify the updates worked
SELECT 
    'VERIFICATION - leadsmart_transformed with baobab_attempt_id = 8' as description,
    COUNT(*) as record_count
FROM leadsmart_transformed 
WHERE baobab_attempt_id = 8;

SELECT 
    'VERIFICATION - leadsmart_transformed_relations with baobab_attempt_id = 8' as description,
    COUNT(*) as record_count
FROM leadsmart_transformed_relations 
WHERE baobab_attempt_id = 8;

-- Check for any remaining null values in release #3 data
SELECT 
    'VERIFICATION - Remaining nulls in release 3 data' as description,
    COUNT(*) as null_count
FROM leadsmart_transformed 
WHERE jrel_release_id = 3 AND baobab_attempt_id IS NULL;

-- Final summary
SELECT 
    baobab_attempt_id,
    COUNT(*) as transformed_count
FROM leadsmart_transformed 
WHERE baobab_attempt_id IS NOT NULL
GROUP BY baobab_attempt_id
ORDER BY baobab_attempt_id;

SELECT 
    baobab_attempt_id,
    COUNT(*) as relations_count
FROM leadsmart_transformed_relations 
WHERE baobab_attempt_id IS NOT NULL
GROUP BY baobab_attempt_id
ORDER BY baobab_attempt_id;