-- =====================================================
-- AGGREGATED_ZIP_CODES: TEXT to JSONB Migration
-- =====================================================
-- Run this in Supabase SQL Editor
-- Date: 2025-10-18
--
-- This converts aggregated_zip_codes from:
--   TEXT: "85001/85002/85003"
-- to:
--   JSONB: ["85001", "85002", "85003"]
-- =====================================================

-- Step 1: Add temporary JSONB column
ALTER TABLE leadsmart_transformed 
ADD COLUMN aggregated_zip_codes_jsonb JSONB;

-- Step 2: Migrate all existing data from TEXT to JSONB array
UPDATE leadsmart_transformed 
SET aggregated_zip_codes_jsonb = CASE 
    WHEN aggregated_zip_codes IS NULL OR aggregated_zip_codes = '' THEN '[]'::jsonb
    ELSE to_jsonb(string_to_array(aggregated_zip_codes, '/'))
END;

-- Step 3: Rename old TEXT column as backup
ALTER TABLE leadsmart_transformed 
RENAME COLUMN aggregated_zip_codes TO aggregated_zip_codes_old_text;

-- Step 4: Rename JSONB column to standard name
ALTER TABLE leadsmart_transformed 
RENAME COLUMN aggregated_zip_codes_jsonb TO aggregated_zip_codes;

-- Step 5: Create GIN index for fast JSONB queries
CREATE INDEX idx_leadsmart_zip_codes_jsonb 
ON leadsmart_transformed 
USING GIN (aggregated_zip_codes);

-- Step 6: Add helpful comment
COMMENT ON COLUMN leadsmart_transformed.aggregated_zip_codes IS 
'JSONB array of zip codes. Example: ["85001", "85002", "85003"]';

-- =====================================================
-- VERIFICATION - Run this to check results
-- =====================================================
SELECT 
    mundial_id,
    aggregated_zip_codes_old_text AS old_text_format,
    aggregated_zip_codes AS new_jsonb_format,
    jsonb_array_length(aggregated_zip_codes) AS zip_count
FROM leadsmart_transformed 
ORDER BY mundial_id DESC
LIMIT 10;

-- =====================================================
-- RESULT:
-- =====================================================
-- ✅ aggregated_zip_codes          -> JSONB (active)
-- ✅ aggregated_zip_codes_old_text -> TEXT (backup)
-- ✅ GIN index created for performance
-- =====================================================

