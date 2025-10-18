-- Convert VARCHAR columns to TEXT in leadsmart_zip_based_data
ALTER TABLE leadsmart_zip_based_data 
ALTER COLUMN state_code TYPE TEXT;

ALTER TABLE leadsmart_zip_based_data 
ALTER COLUMN zip_code TYPE TEXT;

-- Convert VARCHAR columns to TEXT in leadsmart_transformed
ALTER TABLE leadsmart_transformed 
ALTER COLUMN state_code TYPE TEXT;

-- Convert VARCHAR columns to TEXT in leadsmart_file_releases
-- (All columns are already TEXT in this table)

