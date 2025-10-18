-- Add rel_subpart_id column to leadsmart_zip_based_data table
ALTER TABLE leadsmart_zip_based_data
ADD COLUMN rel_subpart_id INTEGER REFERENCES leadsmart_subparts(subpart_id) ON DELETE SET NULL;

-- Create index on rel_subpart_id for faster lookups
CREATE INDEX idx_leadsmart_zip_based_data_rel_subpart_id ON leadsmart_zip_based_data(rel_subpart_id);

