-- Drop rel_transformed_mundial_id column from leadsmart_subsheets table
ALTER TABLE leadsmart_subsheets 
DROP COLUMN IF EXISTS rel_transformed_mundial_id;

