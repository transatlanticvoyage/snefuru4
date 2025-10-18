-- =====================================================
-- Add foreign key columns to leadsmart_transformed
-- Created: 2025-10-18
-- =====================================================

-- Add jrel_release_id column with FK to leadsmart_file_releases
ALTER TABLE leadsmart_transformed
ADD COLUMN jrel_release_id INTEGER REFERENCES leadsmart_file_releases(release_id) ON DELETE SET NULL;

-- Add jrel_subsheet_id column with FK to leadsmart_subsheets
ALTER TABLE leadsmart_transformed
ADD COLUMN jrel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;

-- Add jrel_subpart_id column with FK to leadsmart_subparts
ALTER TABLE leadsmart_transformed
ADD COLUMN jrel_subpart_id INTEGER REFERENCES leadsmart_subparts(subpart_id) ON DELETE SET NULL;

-- Create indexes for better query performance
CREATE INDEX idx_leadsmart_transformed_jrel_release_id ON leadsmart_transformed(jrel_release_id);
CREATE INDEX idx_leadsmart_transformed_jrel_subsheet_id ON leadsmart_transformed(jrel_subsheet_id);
CREATE INDEX idx_leadsmart_transformed_jrel_subpart_id ON leadsmart_transformed(jrel_subpart_id);

-- Verify the changes
-- SELECT column_name, data_type, is_nullable 
-- FROM information_schema.columns 
-- WHERE table_name = 'leadsmart_transformed' 
-- AND column_name IN ('jrel_release_id', 'jrel_subsheet_id', 'jrel_subpart_id');

