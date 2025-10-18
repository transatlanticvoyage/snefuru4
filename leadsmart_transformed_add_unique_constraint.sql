-- =====================================================
-- Add unique constraint to leadsmart_transformed
-- This ensures no duplicate combinations of city, state, payout, and subpart
-- 
-- NOTE: Run leadsmart_transformed_add_fk_columns.sql FIRST
--       before running this constraint, as it requires the jrel_subpart_id column
-- 
-- Created: 2025-10-18
-- =====================================================

-- Add unique constraint on the four columns
ALTER TABLE leadsmart_transformed
ADD CONSTRAINT leadsmart_transformed_unique_combination 
UNIQUE (city_name, state_code, payout, jrel_subpart_id);

-- Verify the constraint was created
-- SELECT constraint_name, constraint_type
-- FROM information_schema.table_constraints
-- WHERE table_name = 'leadsmart_transformed'
-- AND constraint_name = 'leadsmart_transformed_unique_combination';

