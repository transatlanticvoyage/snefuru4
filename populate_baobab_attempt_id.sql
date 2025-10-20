-- SQL commands to manually populate baobab_attempt_id in existing records
-- Run these commands to fill null baobab_attempt_id values based on created_at timestamps

-- =====================================================================================
-- STEP 1: View current state of baobab_transform_attempts to choose which attempt_id to use
-- =====================================================================================
SELECT 
    attempt_id,
    user_id,
    leadsmart_type,
    leadsmart_id,
    total_rows,
    transformed_records_new,
    transformed_records_updated,
    relations_created,
    TO_CHAR(created_at, 'YYYY-MM-DD HH24:MI:SS') as created_at,
    TO_CHAR(completed_at, 'YYYY-MM-DD HH24:MI:SS') as completed_at,
    status
FROM baobab_transform_attempts 
ORDER BY created_at DESC;

-- =====================================================================================
-- STEP 2: Check records with null baobab_attempt_id in both tables
-- =====================================================================================

-- Count null baobab_attempt_id in leadsmart_transformed
SELECT 
    'leadsmart_transformed' AS table_name,
    COUNT(*) AS total_records,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) AS null_baobab_attempt_id_count,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NOT NULL) AS non_null_baobab_attempt_id_count
FROM leadsmart_transformed;

-- Count null baobab_attempt_id in leadsmart_transformed_relations  
SELECT 
    'leadsmart_transformed_relations' AS table_name,
    COUNT(*) AS total_records,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) AS null_baobab_attempt_id_count,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NOT NULL) AS non_null_baobab_attempt_id_count
FROM leadsmart_transformed_relations;

-- =====================================================================================
-- STEP 3: Show date ranges for records with null baobab_attempt_id
-- =====================================================================================

-- Date range for leadsmart_transformed records with null baobab_attempt_id
SELECT 
    'leadsmart_transformed' AS table_name,
    MIN(created_at) AS earliest_null_record,
    MAX(created_at) AS latest_null_record,
    COUNT(*) AS total_null_records
FROM leadsmart_transformed 
WHERE baobab_attempt_id IS NULL;

-- Date range for leadsmart_transformed_relations records with null baobab_attempt_id
SELECT 
    'leadsmart_transformed_relations' AS table_name,
    MIN(created_at) AS earliest_null_record,
    MAX(created_at) AS latest_null_record,
    COUNT(*) AS total_null_records
FROM leadsmart_transformed_relations 
WHERE baobab_attempt_id IS NULL;

-- =====================================================================================
-- STEP 4: MANUAL POPULATION OPTIONS
-- Choose ONE of the following approaches based on your needs:
-- =====================================================================================

-- ----------------------------------------
-- OPTION A: Assign ALL null records to a specific baobab_attempt_id
-- ----------------------------------------
-- Replace {ATTEMPT_ID} with the actual attempt_id from baobab_transform_attempts table

/*
-- Update leadsmart_transformed table
UPDATE leadsmart_transformed 
SET baobab_attempt_id = {ATTEMPT_ID}
WHERE baobab_attempt_id IS NULL;

-- Update leadsmart_transformed_relations table  
UPDATE leadsmart_transformed_relations 
SET baobab_attempt_id = {ATTEMPT_ID}
WHERE baobab_attempt_id IS NULL;
*/

-- ----------------------------------------
-- OPTION B: Assign records based on created_at date ranges
-- ----------------------------------------
-- Example: Assign records created between specific dates to specific attempt_id
-- Replace dates and {ATTEMPT_ID} with actual values

/*
-- Update leadsmart_transformed for specific date range
UPDATE leadsmart_transformed 
SET baobab_attempt_id = {ATTEMPT_ID}
WHERE baobab_attempt_id IS NULL 
  AND created_at >= '2024-10-15 00:00:00'::timestamp
  AND created_at <= '2024-10-15 23:59:59'::timestamp;

-- Update leadsmart_transformed_relations for same date range
UPDATE leadsmart_transformed_relations 
SET baobab_attempt_id = {ATTEMPT_ID}
WHERE baobab_attempt_id IS NULL 
  AND created_at >= '2024-10-15 00:00:00'::timestamp  
  AND created_at <= '2024-10-15 23:59:59'::timestamp;
*/

-- ----------------------------------------
-- OPTION C: Match records by closest timestamp to baobab_transform_attempts
-- ----------------------------------------
-- This assigns each null record to the baobab_transform_attempt with the closest created_at timestamp

/*
-- Update leadsmart_transformed using closest timestamp matching
WITH closest_attempts AS (
  SELECT DISTINCT ON (t.mundial_id)
    t.mundial_id,
    bta.attempt_id
  FROM leadsmart_transformed t
  CROSS JOIN baobab_transform_attempts bta
  WHERE t.baobab_attempt_id IS NULL
  ORDER BY t.mundial_id, ABS(EXTRACT(EPOCH FROM (t.created_at - bta.created_at)))
)
UPDATE leadsmart_transformed 
SET baobab_attempt_id = ca.attempt_id
FROM closest_attempts ca
WHERE leadsmart_transformed.mundial_id = ca.mundial_id;

-- Update leadsmart_transformed_relations using closest timestamp matching
WITH closest_attempts AS (
  SELECT DISTINCT ON (r.relation_id)
    r.relation_id,
    bta.attempt_id
  FROM leadsmart_transformed_relations r
  CROSS JOIN baobab_transform_attempts bta
  WHERE r.baobab_attempt_id IS NULL
  ORDER BY r.relation_id, ABS(EXTRACT(EPOCH FROM (r.created_at - bta.created_at)))
)
UPDATE leadsmart_transformed_relations 
SET baobab_attempt_id = ca.attempt_id
FROM closest_attempts ca
WHERE leadsmart_transformed_relations.relation_id = ca.relation_id;
*/

-- =====================================================================================
-- STEP 5: Verification after manual population
-- =====================================================================================

-- Verify the updates worked - should show 0 null records after successful update
SELECT 
    'leadsmart_transformed' AS table_name,
    COUNT(*) AS total_records,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) AS null_baobab_attempt_id_count,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NOT NULL) AS non_null_baobab_attempt_id_count
FROM leadsmart_transformed
UNION ALL
SELECT 
    'leadsmart_transformed_relations' AS table_name,
    COUNT(*) AS total_records,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NULL) AS null_baobab_attempt_id_count,
    COUNT(*) FILTER (WHERE baobab_attempt_id IS NOT NULL) AS non_null_baobab_attempt_id_count
FROM leadsmart_transformed_relations;

-- Show distribution of baobab_attempt_id values after update
SELECT 
    'leadsmart_transformed' AS table_name,
    baobab_attempt_id,
    COUNT(*) AS record_count
FROM leadsmart_transformed 
WHERE baobab_attempt_id IS NOT NULL
GROUP BY baobab_attempt_id
UNION ALL
SELECT 
    'leadsmart_transformed_relations' AS table_name,
    baobab_attempt_id,
    COUNT(*) AS record_count
FROM leadsmart_transformed_relations 
WHERE baobab_attempt_id IS NOT NULL
GROUP BY baobab_attempt_id
ORDER BY table_name, baobab_attempt_id;