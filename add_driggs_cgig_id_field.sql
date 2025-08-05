-- Add new field to sitespren table for citation gig reference
ALTER TABLE sitespren 
ADD COLUMN driggs_cgig_id INTEGER REFERENCES citation_gigs(cgig_id);

-- Add index for performance
CREATE INDEX idx_sitespren_driggs_cgig_id ON sitespren(driggs_cgig_id);

-- Add comment to document the field purpose
COMMENT ON COLUMN sitespren.driggs_cgig_id IS 
'References the citation gig (from citation_gigs table) assigned to handle citations for this site. Links to cgig_id in citation_gigs table.';