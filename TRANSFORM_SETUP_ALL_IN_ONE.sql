-- =====================================================
-- COMPLETE TRANSFORM SETUP - ALL IN ONE
-- Run this entire file in Supabase SQL Editor
-- This fixes the transform function errors and adds duplicate prevention
-- Created: 2025-10-18
-- =====================================================

-- =====================================================
-- STEP 1: Add rel_subsheet_id to leadsmart_zip_based_data
-- =====================================================

ALTER TABLE leadsmart_zip_based_data
ADD COLUMN rel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;

CREATE INDEX idx_leadsmart_zip_based_data_rel_subsheet_id ON leadsmart_zip_based_data(rel_subsheet_id);


-- =====================================================
-- STEP 2: Add jrel_* columns to leadsmart_transformed
-- =====================================================

ALTER TABLE leadsmart_transformed
ADD COLUMN jrel_release_id INTEGER REFERENCES leadsmart_file_releases(release_id) ON DELETE SET NULL;

ALTER TABLE leadsmart_transformed
ADD COLUMN jrel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;

ALTER TABLE leadsmart_transformed
ADD COLUMN jrel_subpart_id INTEGER REFERENCES leadsmart_subparts(subpart_id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_leadsmart_transformed_jrel_release_id ON leadsmart_transformed(jrel_release_id);
CREATE INDEX idx_leadsmart_transformed_jrel_subsheet_id ON leadsmart_transformed(jrel_subsheet_id);
CREATE INDEX idx_leadsmart_transformed_jrel_subpart_id ON leadsmart_transformed(jrel_subpart_id);


-- =====================================================
-- STEP 3: Add unique constraint to leadsmart_transformed
-- =====================================================

ALTER TABLE leadsmart_transformed
ADD CONSTRAINT leadsmart_transformed_unique_combination 
UNIQUE (city_name, state_code, payout, jrel_subpart_id);


-- =====================================================
-- VERIFICATION QUERIES (uncomment to run)
-- =====================================================

-- Verify leadsmart_zip_based_data columns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'leadsmart_zip_based_data' 
-- AND column_name IN ('rel_release_id', 'rel_subsheet_id', 'rel_subpart_id')
-- ORDER BY column_name;

-- Verify leadsmart_transformed columns
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'leadsmart_transformed' 
-- AND column_name IN ('jrel_release_id', 'jrel_subsheet_id', 'jrel_subpart_id')
-- ORDER BY column_name;

-- Verify unique constraint
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'leadsmart_transformed'
-- AND constraint_name = 'leadsmart_transformed_unique_combination';

-- =====================================================
-- SUCCESS! You can now use the transform function
-- =====================================================

