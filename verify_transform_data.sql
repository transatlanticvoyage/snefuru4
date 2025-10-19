-- Verify transform logic and data distribution

-- 1. Check what rel_* values exist in source data for release 3
SELECT 
  rel_release_id,
  rel_subsheet_id,
  rel_subpart_id,
  COUNT(*) as row_count
FROM leadsmart_zip_based_data
WHERE rel_release_id = 3
GROUP BY rel_release_id, rel_subsheet_id, rel_subpart_id
ORDER BY rel_subsheet_id, rel_subpart_id
LIMIT 20;

-- 2. Check what jrel_* values exist in transformed data
SELECT 
  jrel_release_id,
  jrel_subsheet_id,
  jrel_subpart_id,
  COUNT(*) as record_count
FROM leadsmart_transformed
WHERE jrel_release_id = 3
GROUP BY jrel_release_id, jrel_subsheet_id, jrel_subpart_id
ORDER BY jrel_subsheet_id, jrel_subpart_id
LIMIT 20;

-- 3. Check if transformed data has variety in jrel_subsheet_id
SELECT 
  jrel_subsheet_id,
  COUNT(*) as count
FROM leadsmart_transformed
WHERE jrel_release_id = 3
GROUP BY jrel_subsheet_id
ORDER BY jrel_subsheet_id;

-- 4. Check if transformed data has variety in jrel_subpart_id  
SELECT 
  jrel_subpart_id,
  COUNT(*) as count
FROM leadsmart_transformed
WHERE jrel_release_id = 3
GROUP BY jrel_subpart_id
ORDER BY jrel_subpart_id;

-- 5. Check a few sample transformed records
SELECT 
  mundial_id,
  city_name,
  state_code,
  payout,
  jrel_release_id,
  jrel_subsheet_id,
  jrel_subpart_id
FROM leadsmart_transformed
WHERE jrel_release_id = 3
ORDER BY mundial_id
LIMIT 20;

