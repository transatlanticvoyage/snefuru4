-- Update Transform #8 records with baobab_attempt_id = 8
-- Based on investigation findings:
-- - Transform #8 records were created at 12:00:00 PM hour (280,527 records)
-- - NOT at the 01:02:37 AM start time
-- - All records in leadsmart_transformed_relations already have baobab_attempt_id assigned
-- - We need to identify the 280,527 records from the 12:00:00 PM hour

-- =====================================================================================
-- STEP 1: Identify Transform #8 records (12:00:00 PM hour + release #3)
-- =====================================================================================

-- Check records created in the 12:00:00 PM hour for release #3
SELECT 
    'Transform 8 candidates - 12PM hour + release 3' as description,
    COUNT(*) as record_count,
    MIN(created_at) as earliest_created,
    MAX(created_at) as latest_created,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NOT NULL) as non_null_baobab_attempt_id
FROM leadsmart_transformed 
WHERE jrel_release_id = 3
  AND created_at >= '2025-10-20 12:00:00'::timestamp 
  AND created_at < '2025-10-20 13:00:00'::timestamp;

-- Show sample records to verify these are the right ones
SELECT 
    'Sample Transform 8 records' as sample_type,
    mundial_id,
    city_name,
    state_code,
    jrel_release_id,
    created_at,
    updated_at,
    baobab_attempt_id
FROM leadsmart_transformed 
WHERE jrel_release_id = 3
  AND created_at >= '2025-10-20 12:00:00'::timestamp 
  AND created_at < '2025-10-20 13:00:00'::timestamp
ORDER BY created_at
LIMIT 10;

-- =====================================================================================
-- STEP 2: Check corresponding relations records
-- =====================================================================================

-- Check relations for these Transform #8 records
WITH transform_8_candidates AS (
  SELECT t.mundial_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.created_at >= '2025-10-20 12:00:00'::timestamp 
    AND t.created_at < '2025-10-20 13:00:00'::timestamp
)
SELECT 
    'Transform 8 relations candidates' as description,
    COUNT(*) as record_count,
    MIN(r.created_at) as earliest_created,
    MAX(r.created_at) as latest_created,
    COUNT(*) FILTER (WHERE r.baobab_attempt_id IS NULL) as null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE r.baobab_attempt_id IS NOT NULL) as non_null_baobab_attempt_id,
    COUNT(*) FILTER (WHERE r.baobab_attempt_id = 8) as already_has_attempt_8
FROM leadsmart_transformed_relations r
JOIN transform_8_candidates t8 ON r.transformed_mundial_id = t8.mundial_id;

-- =====================================================================================
-- STEP 3: PREVIEW - Exact count of what will be updated
-- =====================================================================================

-- Final count verification - should be exactly 280,527
SELECT 
    'FINAL PREVIEW - leadsmart_transformed records to update' as preview_type,
    COUNT(*) as records_to_update_count
FROM leadsmart_transformed 
WHERE jrel_release_id = 3
  AND created_at >= '2025-10-20 12:00:00'::timestamp 
  AND created_at < '2025-10-20 13:00:00'::timestamp
  AND baobab_attempt_id IS NULL;

-- Relations count
WITH transform_8_candidates AS (
  SELECT t.mundial_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.created_at >= '2025-10-20 12:00:00'::timestamp 
    AND t.created_at < '2025-10-20 13:00:00'::timestamp
    AND t.baobab_attempt_id IS NULL
)
SELECT 
    'FINAL PREVIEW - leadsmart_transformed_relations records to update' as preview_type,
    COUNT(*) as records_to_update_count
FROM leadsmart_transformed_relations r
JOIN transform_8_candidates t8 ON r.transformed_mundial_id = t8.mundial_id
WHERE r.baobab_attempt_id IS NULL;

-- =====================================================================================
-- STEP 4: ACTUAL UPDATE STATEMENTS
-- =====================================================================================
-- Only run these after verifying the preview counts above match expectations!

/*
-- Update 1: leadsmart_transformed records (should update ~280,527 records)
UPDATE leadsmart_transformed 
SET baobab_attempt_id = 8
WHERE jrel_release_id = 3
  AND created_at >= '2025-10-20 12:00:00'::timestamp 
  AND created_at < '2025-10-20 13:00:00'::timestamp
  AND baobab_attempt_id IS NULL;

-- Update 2: leadsmart_transformed_relations records
WITH transform_8_updated AS (
  SELECT t.mundial_id
  FROM leadsmart_transformed t
  WHERE t.jrel_release_id = 3
    AND t.created_at >= '2025-10-20 12:00:00'::timestamp 
    AND t.created_at < '2025-10-20 13:00:00'::timestamp
    AND t.baobab_attempt_id = 8  -- Should be 8 after Update 1
)
UPDATE leadsmart_transformed_relations 
SET baobab_attempt_id = 8
FROM transform_8_updated t8
WHERE leadsmart_transformed_relations.transformed_mundial_id = t8.mundial_id
  AND leadsmart_transformed_relations.baobab_attempt_id IS NULL;
*/

-- =====================================================================================
-- STEP 5: POST-UPDATE VERIFICATION
-- =====================================================================================

-- Verify updates worked
SELECT 
    'POST-UPDATE - leadsmart_transformed with baobab_attempt_id = 8' as verification_type,
    COUNT(*) as record_count
FROM leadsmart_transformed 
WHERE baobab_attempt_id = 8;

SELECT 
    'POST-UPDATE - leadsmart_transformed_relations with baobab_attempt_id = 8' as verification_type,
    COUNT(*) as record_count
FROM leadsmart_transformed_relations 
WHERE baobab_attempt_id = 8;

-- Check if any nulls remain for release #3
SELECT 
    'POST-UPDATE - Remaining nulls in release 3' as verification_type,
    COUNT(*) as remaining_null_count
FROM leadsmart_transformed 
WHERE jrel_release_id = 3 AND baobab_attempt_id IS NULL;

-- Final distribution by baobab_attempt_id
SELECT 
    'FINAL DISTRIBUTION - leadsmart_transformed by baobab_attempt_id' as summary_type,
    baobab_attempt_id,
    COUNT(*) as record_count
FROM leadsmart_transformed 
WHERE baobab_attempt_id IS NOT NULL
GROUP BY baobab_attempt_id
ORDER BY baobab_attempt_id;

SELECT 
    'FINAL DISTRIBUTION - leadsmart_transformed_relations by baobab_attempt_id' as summary_type,
    baobab_attempt_id,
    COUNT(*) as record_count
FROM leadsmart_transformed_relations 
WHERE baobab_attempt_id IS NOT NULL
GROUP BY baobab_attempt_id
ORDER BY baobab_attempt_id;