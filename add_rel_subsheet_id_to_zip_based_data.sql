-- =====================================================
-- Add rel_subsheet_id column to leadsmart_zip_based_data
-- This column is required for the transform function to work properly
-- Created: 2025-10-18
-- =====================================================

-- Add rel_subsheet_id column with FK to leadsmart_subsheets
ALTER TABLE leadsmart_zip_based_data
ADD COLUMN rel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;

-- Create index for better query performance
CREATE INDEX idx_leadsmart_zip_based_data_rel_subsheet_id ON leadsmart_zip_based_data(rel_subsheet_id);

-- Verify the change
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'leadsmart_zip_based_data' 
-- AND column_name = 'rel_subsheet_id';

