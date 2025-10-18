-- =====================================================
-- MIGRATION: Convert aggregated_zip_codes from TEXT to JSONB
-- Date: 2025-10-18
-- =====================================================
-- This migration converts the aggregated_zip_codes column from TEXT
-- (slash-separated: "85001/85002/85003") to JSONB array format: ["85001", "85002", "85003"]

-- Step 1: Add new JSONB column (temporary name)
ALTER TABLE leadsmart_transformed 
ADD COLUMN aggregated_zip_codes_jsonb JSONB;

-- Step 2: Migrate existing data from TEXT to JSONB array
-- Handles both null values and empty strings
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

-- Step 5: Add GIN index for efficient JSONB querying
-- This enables fast searches like: WHERE aggregated_zip_codes @> '["85001"]'
CREATE INDEX idx_leadsmart_zip_codes_jsonb ON leadsmart_transformed USING GIN (aggregated_zip_codes);

-- Step 6: Add a helpful comment
COMMENT ON COLUMN leadsmart_transformed.aggregated_zip_codes IS 
'JSONB array of zip codes. Example: ["85001", "85002", "85003"]. Migrated from TEXT slash-separated format.';

-- Step 7: Verify migration (optional - run separately to check results)
-- SELECT 
--     mundial_id,
--     aggregated_zip_codes_old_text AS old_text_format,
--     aggregated_zip_codes AS new_jsonb_format,
--     jsonb_array_length(aggregated_zip_codes) AS zip_count
-- FROM leadsmart_transformed 
-- LIMIT 10;

-- =====================================================
-- RESULT:
-- =====================================================
-- aggregated_zip_codes          -> JSONB (active, standard name)
-- aggregated_zip_codes_old_text -> TEXT (backup, deprecated)

-- =====================================================
-- ROLLBACK PLAN (if needed)
-- =====================================================
-- If something goes wrong, you can rollback with:
-- DROP INDEX IF EXISTS idx_leadsmart_zip_codes_jsonb;
-- ALTER TABLE leadsmart_transformed DROP COLUMN aggregated_zip_codes;
-- ALTER TABLE leadsmart_transformed RENAME COLUMN aggregated_zip_codes_old_text TO aggregated_zip_codes;

-- =====================================================
-- CLEANUP (do this AFTER a few days of stable operation)
-- =====================================================
-- Once everything is working well, drop the old TEXT backup column:
-- ALTER TABLE leadsmart_transformed DROP COLUMN aggregated_zip_codes_old_text;

