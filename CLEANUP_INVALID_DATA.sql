-- =====================================================
-- CLEANUP INVALID DATA FROM leadsmart_zip_based_data
-- Optional - Run this to remove header rows and invalid data
-- PREVIEW before deleting! Uncomment DELETE statements when ready
-- Created: 2025-10-18
-- =====================================================

-- =====================================================
-- STEP 1: Preview what will be deleted
-- =====================================================

-- Find rows that look like header rows
SELECT global_row_id, zip_code, payout, city_name, state_code, rel_release_id, rel_subsheet_id, rel_subpart_id
FROM leadsmart_zip_based_data 
WHERE LOWER(city_name) IN ('city', 'city_name', 'city name')
   OR LOWER(state_code) IN ('state', 'state_code', 'state code')
ORDER BY global_row_id;

-- Find rows with missing critical data
SELECT global_row_id, zip_code, payout, city_name, state_code, rel_release_id, rel_subsheet_id, rel_subpart_id
FROM leadsmart_zip_based_data 
WHERE city_name IS NULL 
   OR state_code IS NULL 
   OR payout IS NULL
ORDER BY global_row_id;


-- =====================================================
-- STEP 2: Delete invalid data (UNCOMMENT TO RUN)
-- =====================================================

-- Delete header rows
-- DELETE FROM leadsmart_zip_based_data 
-- WHERE LOWER(city_name) IN ('city', 'city_name', 'city name')
--    OR LOWER(state_code) IN ('state', 'state_code', 'state code');

-- Delete rows with missing critical data
-- DELETE FROM leadsmart_zip_based_data 
-- WHERE city_name IS NULL 
--    OR state_code IS NULL 
--    OR payout IS NULL;


-- =====================================================
-- STEP 3: Verify cleanup (UNCOMMENT TO RUN)
-- =====================================================

-- Count total rows
-- SELECT COUNT(*) as total_rows FROM leadsmart_zip_based_data;

-- Count valid rows (should match total after cleanup)
-- SELECT COUNT(*) as valid_rows 
-- FROM leadsmart_zip_based_data 
-- WHERE city_name IS NOT NULL 
--   AND state_code IS NOT NULL 
--   AND payout IS NOT NULL
--   AND LOWER(city_name) NOT IN ('city', 'city_name', 'city name')
--   AND LOWER(state_code) NOT IN ('state', 'state_code', 'state code');

