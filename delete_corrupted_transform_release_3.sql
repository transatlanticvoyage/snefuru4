-- Delete corrupted transformed data for release 3
-- DOES NOT touch leadsmart_zip_based_data at all!

-- Step 1: Delete relations for release 3
-- These link the original zip_based_data rows to the transformed records
DELETE FROM leadsmart_transformed_relations
WHERE original_global_id IN (
  SELECT global_row_id 
  FROM leadsmart_zip_based_data 
  WHERE rel_release_id = 3
);

-- Step 2: Delete transformed records for release 3
DELETE FROM leadsmart_transformed
WHERE jrel_release_id = 3;

-- Verification queries
SELECT 'Deletion complete!' as status;

-- Verify relations deleted
SELECT COUNT(*) as remaining_relations_for_release_3
FROM leadsmart_transformed_relations
WHERE original_global_id IN (
  SELECT global_row_id 
  FROM leadsmart_zip_based_data 
  WHERE rel_release_id = 3
);
-- Expected: 0

-- Verify transformed records deleted
SELECT COUNT(*) as remaining_transformed_for_release_3
FROM leadsmart_transformed
WHERE jrel_release_id = 3;
-- Expected: 0

-- Verify zip_based_data is UNTOUCHED
SELECT COUNT(*) as zip_based_data_still_exists
FROM leadsmart_zip_based_data
WHERE rel_release_id = 3;
-- Expected: 449,093 (your original row count)

-- Show summary
SELECT 
  'leadsmart_zip_based_data' as table_name,
  COUNT(*) as total_rows
FROM leadsmart_zip_based_data
WHERE rel_release_id = 3
UNION ALL
SELECT 
  'leadsmart_transformed' as table_name,
  COUNT(*) as total_rows
FROM leadsmart_transformed
WHERE jrel_release_id = 3
UNION ALL
SELECT 
  'leadsmart_transformed_relations' as table_name,
  COUNT(*) as total_rows
FROM leadsmart_transformed_relations
WHERE original_global_id IN (
  SELECT global_row_id 
  FROM leadsmart_zip_based_data 
  WHERE rel_release_id = 3
);

