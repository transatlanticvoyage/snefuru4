-- Reset Serial Sequences for LeadSmart Tables
-- This resets the auto-increment sequences to max_id + 1
-- Only run this if you want the NEXT IDs to be sequential
-- NOTE: This won't fix existing gaps, only prevents future large jumps

-- Reset leadsmart_file_releases sequence
SELECT setval(
  pg_get_serial_sequence('leadsmart_file_releases', 'release_id'),
  COALESCE((SELECT MAX(release_id) FROM leadsmart_file_releases), 0) + 1,
  false
);

-- Reset leadsmart_subsheets sequence
SELECT setval(
  pg_get_serial_sequence('leadsmart_subsheets', 'subsheet_id'),
  COALESCE((SELECT MAX(subsheet_id) FROM leadsmart_subsheets), 0) + 1,
  false
);

-- Reset leadsmart_subparts sequence
SELECT setval(
  pg_get_serial_sequence('leadsmart_subparts', 'subpart_id'),
  COALESCE((SELECT MAX(subpart_id) FROM leadsmart_subparts), 0) + 1,
  false
);

-- Verify the sequences are now set correctly
SELECT 'leadsmart_file_releases' as table_name, 
       last_value as next_id,
       (SELECT MAX(release_id) FROM leadsmart_file_releases) as current_max_id
FROM leadsmart_file_releases_release_id_seq;

SELECT 'leadsmart_subsheets' as table_name,
       last_value as next_id,
       (SELECT MAX(subsheet_id) FROM leadsmart_subsheets) as current_max_id
FROM leadsmart_subsheets_subsheet_id_seq;

SELECT 'leadsmart_subparts' as table_name,
       last_value as next_id,
       (SELECT MAX(subpart_id) FROM leadsmart_subparts) as current_max_id
FROM leadsmart_subparts_subpart_id_seq;

-- IMPORTANT NOTES:
-- 1. This only affects NEW inserts, not existing records
-- 2. Gaps can still occur in the future from failed inserts
-- 3. This is a cosmetic fix only - functionality is unchanged
-- 4. Running this during active usage may cause issues
-- 5. Consider if gaps really matter for internal IDs

