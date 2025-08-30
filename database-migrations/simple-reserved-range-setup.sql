-- Simple Setup: Reserved Range for Driggs Packs Table
-- Run this in Supabase SQL Editor to implement the reserved range

-- 1. Create sequence starting from 301
CREATE SEQUENCE IF NOT EXISTS driggs_packs_dpack_id_seq
    START WITH 301
    INCREMENT BY 1;

-- 2. Set sequence to current max + 1 (to avoid conflicts)
SELECT setval('driggs_packs_dpack_id_seq', 
    COALESCE((SELECT MAX(dpack_id) FROM driggs_packs), 300) + 1, 
    false);

-- 3. Update table to use new sequence for new records
ALTER TABLE driggs_packs 
    ALTER COLUMN dpack_id SET DEFAULT nextval('driggs_packs_dpack_id_seq');

-- 4. Create trigger function to enforce reserved range
CREATE OR REPLACE FUNCTION enforce_driggs_packs_id_range()
RETURNS TRIGGER AS $$
BEGIN
    -- Prevent users from creating packs with IDs 1-299
    IF NEW.dpack_id BETWEEN 1 AND 299 THEN
        RAISE EXCEPTION 'dpack_id % is reserved for system use. End users can only create packs with IDs 301 and greater.', NEW.dpack_id;
    END IF;
    
    -- Auto-assign next available ID if none provided
    IF NEW.dpack_id IS NULL THEN
        NEW.dpack_id := nextval('driggs_packs_dpack_id_seq');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- 5. Create the trigger
DROP TRIGGER IF EXISTS enforce_driggs_packs_id_range_trigger ON driggs_packs;
CREATE TRIGGER enforce_driggs_packs_id_range_trigger
    BEFORE INSERT ON driggs_packs
    FOR EACH ROW
    EXECUTE FUNCTION enforce_driggs_packs_id_range();

-- 6. Create status view
CREATE OR REPLACE VIEW driggs_packs_status AS
SELECT 
    'Reserved Range (1-299)' as range_type,
    COUNT(*) as pack_count,
    MIN(dpack_id) as min_id,
    MAX(dpack_id) as max_id
FROM driggs_packs 
WHERE dpack_id BETWEEN 1 AND 299

UNION ALL

SELECT 
    'User Range (301+)' as range_type,
    COUNT(*) as pack_count,
    MIN(dpack_id) as min_id,
    MAX(dpack_id) as max_id
FROM driggs_packs 
WHERE dpack_id >= 301

UNION ALL

SELECT 
    'Total' as range_type,
    COUNT(*) as pack_count,
    MIN(dpack_id) as min_id,
    MAX(dpack_id) as max_id
FROM driggs_packs;

-- Check the current status
SELECT * FROM driggs_packs_status;
