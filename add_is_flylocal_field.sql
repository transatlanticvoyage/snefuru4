-- Add is_flylocal boolean field to sitespren table
-- Default value: false

ALTER TABLE sitespren 
ADD COLUMN is_flylocal BOOLEAN DEFAULT false;

-- Add comment to document the field purpose
COMMENT ON COLUMN sitespren.is_flylocal IS 
'Boolean flag to indicate if site is flylocal. Default: false';

-- Optional: Update existing rows to ensure they have the default value
-- (This is usually not needed as ALTER TABLE with DEFAULT handles this)
-- UPDATE sitespren SET is_flylocal = false WHERE is_flylocal IS NULL;