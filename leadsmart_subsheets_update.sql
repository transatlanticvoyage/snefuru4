-- Drop the rel_original_global_row_id column from leadsmart_subsheets
ALTER TABLE leadsmart_subsheets 
DROP COLUMN IF EXISTS rel_original_global_row_id;

-- Add new rel_release_id column with foreign key to leadsmart_file_releases
ALTER TABLE leadsmart_subsheets
ADD COLUMN rel_release_id INTEGER REFERENCES leadsmart_file_releases(release_id) ON DELETE SET NULL;

-- Create index on rel_release_id for faster lookups
CREATE INDEX idx_leadsmart_subsheets_rel_release_id ON leadsmart_subsheets(rel_release_id);

