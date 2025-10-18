-- =====================================================
-- Add rel_subsheet_id to leadsmart_zip_based_data
-- COPY AND RUN THIS ENTIRE FILE IN SUPABASE SQL EDITOR
-- Created: 2025-10-18
-- =====================================================

-- Step 1: Add the column
ALTER TABLE leadsmart_zip_based_data
ADD COLUMN rel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;

-- Step 2: Create index for performance
CREATE INDEX idx_leadsmart_zip_based_data_rel_subsheet_id ON leadsmart_zip_based_data(rel_subsheet_id);

-- Step 3: Verify it worked
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leadsmart_zip_based_data' 
AND column_name = 'rel_subsheet_id';

-- Expected result:
-- column_name      | data_type | is_nullable
-- rel_subsheet_id  | integer   | YES

-- ✅ SUCCESS! The column is now ready to use.

