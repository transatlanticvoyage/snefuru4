-- =====================================================
-- ⚠️⚠️⚠️ YOU MUST RUN THIS IN SUPABASE ⚠️⚠️⚠️
-- 
-- You mentioned you don't see rel_subsheet_id in your database
-- This SQL creates that column
-- 
-- COPY THIS ENTIRE FILE AND PASTE INTO SUPABASE SQL EDITOR
-- =====================================================

-- Create the rel_subsheet_id column
ALTER TABLE leadsmart_zip_based_data
ADD COLUMN rel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;

-- Create index for performance
CREATE INDEX idx_leadsmart_zip_based_data_rel_subsheet_id ON leadsmart_zip_based_data(rel_subsheet_id);

-- =====================================================
-- ✅ DONE! Now verify it worked:
-- =====================================================

SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'leadsmart_zip_based_data' 
AND column_name IN ('rel_release_id', 'rel_subsheet_id', 'rel_subpart_id')
ORDER BY column_name;

-- Expected result (you should see all 3 columns):
-- column_name       | data_type | is_nullable
-- rel_release_id    | integer   | YES
-- rel_subsheet_id   | integer   | YES
-- rel_subpart_id    | integer   | YES

-- =====================================================
-- After running this:
-- 1. Refresh your browser
-- 2. Check /leadsmart_tank page
-- 3. Column headers should show ★rel_release_id, ★rel_subsheet_id, ★rel_subpart_id
-- 4. When you filter, the active column should have yellow background
-- =====================================================

