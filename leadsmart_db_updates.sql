-- Step 1: Drop the leadsmart_file_release column from leadsmart_zip_based_data
ALTER TABLE leadsmart_zip_based_data 
DROP COLUMN IF EXISTS leadsmart_file_release;

-- Step 2: Create new table leadsmart_file_releases
CREATE TABLE leadsmart_file_releases (
  release_id SERIAL PRIMARY KEY,
  release_date TEXT,
  sheet_link TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Step 3: Add rel_release_id foreign key column to leadsmart_zip_based_data
ALTER TABLE leadsmart_zip_based_data
ADD COLUMN rel_release_id INTEGER REFERENCES leadsmart_file_releases(release_id) ON DELETE SET NULL;

-- Create index on rel_release_id for faster lookups
CREATE INDEX idx_leadsmart_zip_based_data_rel_release_id ON leadsmart_zip_based_data(rel_release_id);

-- Create a function to automatically update the updated_at timestamp for leadsmart_file_releases
CREATE OR REPLACE FUNCTION update_leadsmart_file_releases_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create a trigger to call the function on update
CREATE TRIGGER set_leadsmart_file_releases_updated_at
  BEFORE UPDATE ON leadsmart_file_releases
  FOR EACH ROW
  EXECUTE FUNCTION update_leadsmart_file_releases_updated_at();

