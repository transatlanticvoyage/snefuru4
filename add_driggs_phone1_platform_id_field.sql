-- Add new field to sitespren table
ALTER TABLE sitespren 
ADD COLUMN driggs_phone1_platform_id INTEGER REFERENCES call_platforms(platform_id);

-- Add index for performance
CREATE INDEX idx_sitespren_driggs_phone1_platform_id ON sitespren(driggs_phone1_platform_id);

-- Add comment to document the field purpose
COMMENT ON COLUMN sitespren.driggs_phone1_platform_id IS 
'References the call platform (from call_platforms table) assigned to handle phone calls for this site. Links to platform_id in call_platforms table.';