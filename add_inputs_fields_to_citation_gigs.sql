-- Add new TEXT fields to citation_gigs table
ALTER TABLE citation_gigs 
ADD COLUMN inputs_v1 TEXT NULL,
ADD COLUMN inputs_v2 TEXT NULL,
ADD COLUMN inputs_v3 TEXT NULL;

-- Add comments to document the field purposes
COMMENT ON COLUMN citation_gigs.inputs_v1 IS 'Input field version 1 for citation gig data';
COMMENT ON COLUMN citation_gigs.inputs_v2 IS 'Input field version 2 for citation gig data';
COMMENT ON COLUMN citation_gigs.inputs_v3 IS 'Input field version 3 for citation gig data';