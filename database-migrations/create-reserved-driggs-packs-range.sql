-- Migration: Create Reserved Range for Driggs Packs Table
-- Purpose: Reserve IDs 1-299 for system use, allowing end users to create packs starting from ID 301
-- Date: 2024-12-19

-- Step 1: Create a sequence for driggs_packs that starts from 301
-- This ensures new records automatically get IDs 301 and greater
CREATE SEQUENCE IF NOT EXISTS driggs_packs_dpack_id_seq
    START WITH 301
    INCREMENT BY 1
    NO MINVALUE
    NO MAXVALUE
    CACHE 1;

-- Step 2: Alter the driggs_packs table to use the new sequence
-- This will affect only new records, existing records keep their current IDs
ALTER TABLE driggs_packs 
    ALTER COLUMN dpack_id SET DEFAULT nextval('driggs_packs_dpack_id_seq');

-- Step 3: Set the sequence to start from the next available ID
-- This ensures we don't have conflicts with existing records
SELECT setval('driggs_packs_dpack_id_seq', 
    COALESCE((SELECT MAX(dpack_id) FROM driggs_packs), 300) + 1, 
    false);

-- Step 4: Create a trigger function to enforce the reserved range
CREATE OR REPLACE FUNCTION enforce_driggs_packs_id_range()
RETURNS TRIGGER AS $$
BEGIN
    -- Check if the new ID is in the reserved range (1-299)
    IF NEW.dpack_id BETWEEN 1 AND 299 THEN
        RAISE EXCEPTION 'dpack_id % is reserved for system use. End users can only create packs with IDs 301 and greater.', NEW.dpack_id;
    END IF;
    
    -- If no ID is provided, let the sequence handle it (will be 301+)
    IF NEW.dpack_id IS NULL THEN
        NEW.dpack_id := nextval('driggs_packs_dpack_id_seq');
    END IF;
    
    RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Step 5: Create the trigger to enforce the rule
DROP TRIGGER IF EXISTS enforce_driggs_packs_id_range_trigger ON driggs_packs;
CREATE TRIGGER enforce_driggs_packs_id_range_trigger
    BEFORE INSERT ON driggs_packs
    FOR EACH ROW
    EXECUTE FUNCTION enforce_driggs_packs_id_range();

-- Step 6: Create a function to manually insert system packs in reserved range
-- This function bypasses the trigger and is intended for admin/system use only
CREATE OR REPLACE FUNCTION insert_system_driggs_pack(
    p_dpack_id INTEGER,
    p_dpack_datum TEXT,
    p_dpack_note TEXT DEFAULT NULL,
    p_dpack_realm TEXT DEFAULT 'system',
    p_dpack_name TEXT DEFAULT NULL,
    p_dpack_description TEXT DEFAULT NULL,
    p_user_id_created_by UUID DEFAULT NULL
)
RETURNS INTEGER AS $$
BEGIN
    -- Only allow IDs 1-299 for system packs
    IF p_dpack_id < 1 OR p_dpack_id > 299 THEN
        RAISE EXCEPTION 'System packs can only have IDs between 1 and 299. Got: %', p_dpack_id;
    END IF;
    
    -- Temporarily disable the trigger
    ALTER TABLE driggs_packs DISABLE TRIGGER enforce_driggs_packs_id_range_trigger;
    
    -- Insert the system pack
    INSERT INTO driggs_packs (
        dpack_id,
        dpack_datum,
        dpack_note,
        dpack_realm,
        dpack_name,
        dpack_description,
        user_id_created_by,
        created_at,
        updated_at,
        is_starred,
        is_flagged
    ) VALUES (
        p_dpack_id,
        p_dpack_datum,
        p_dpack_note,
        p_dpack_realm,
        p_dpack_name,
        p_dpack_description,
        p_user_id_created_by,
        NOW(),
        NOW(),
        false,
        false
    );
    
    -- Re-enable the trigger
    ALTER TABLE driggs_packs ENABLE TRIGGER enforce_driggs_packs_id_range_trigger;
    
    RETURN p_dpack_id;
END;
$$ LANGUAGE plpgsql;

-- Step 7: Grant appropriate permissions
-- Only superusers should be able to insert system packs
REVOKE EXECUTE ON FUNCTION insert_system_driggs_pack(UUID) FROM PUBLIC;
GRANT EXECUTE ON FUNCTION insert_system_driggs_pack(UUID) TO postgres;

-- Step 8: Create a view to show the current state
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

-- Step 9: Add comments for documentation
COMMENT ON FUNCTION enforce_driggs_packs_id_range() IS 'Enforces that end users can only create driggs_packs with IDs 301 and greater. IDs 1-299 are reserved for system use.';
COMMENT ON FUNCTION insert_system_driggs_pack(UUID) IS 'Admin function to insert system driggs_packs in the reserved range (1-299). Only superusers should use this function.';
COMMENT ON VIEW driggs_packs_status IS 'Shows the current distribution of driggs_packs across reserved and user ranges.';

-- Migration completed successfully
-- End users can now only create driggs_packs with IDs 301+
-- System packs can be created in the reserved range 1-299 using the insert_system_driggs_pack function
