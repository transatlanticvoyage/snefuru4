-- Drop columns from leadsmart_zip_based_data table
ALTER TABLE leadsmart_zip_based_data 
DROP COLUMN IF EXISTS subsheet;

ALTER TABLE leadsmart_zip_based_data 
DROP COLUMN IF EXISTS subpart_of_subsheet;

ALTER TABLE leadsmart_zip_based_data 
DROP COLUMN IF EXISTS payout_note;

