-- =====================================================
-- RENAME: aggregated_zip_codes_jsonb → aggregated_zip_codes
-- =====================================================
-- Run this in Supabase SQL Editor
-- Date: 2025-10-18
--
-- Step 1: Drop old TEXT column named aggregated_zip_codes
-- Step 2: Rename JSONB column from aggregated_zip_codes_jsonb to aggregated_zip_codes
--
-- All JSONB data is preserved during rename.
-- =====================================================

-- Step 1: Drop the old TEXT column
ALTER TABLE leadsmart_transformed 
DROP COLUMN IF EXISTS aggregated_zip_codes;

-- Step 2: Rename the JSONB column to standard name
ALTER TABLE leadsmart_transformed 
RENAME COLUMN aggregated_zip_codes_jsonb TO aggregated_zip_codes;

-- =====================================================
-- VERIFICATION - Run this to confirm the rename worked
-- =====================================================
SELECT 
    column_name, 
    data_type,
    is_nullable
FROM information_schema.columns 
WHERE table_name = 'leadsmart_transformed' 
  AND column_name LIKE '%aggregated_zip%'
ORDER BY column_name;

-- Expected result:
-- aggregated_zip_codes | jsonb | YES
-- =====================================================

