-- Alter leadsmart_pico_count_cache to support one row per user
-- Changes: updated_by -> user_id, remove single row constraint, add unique per user

-- Step 1: Clear the existing row FIRST (before any constraint changes)
DELETE FROM leadsmart_pico_count_cache;

-- Step 2: Rename column
ALTER TABLE leadsmart_pico_count_cache 
RENAME COLUMN updated_by TO user_id;

-- Step 3: Make user_id NOT NULL (required for unique constraint)
ALTER TABLE leadsmart_pico_count_cache 
ALTER COLUMN user_id SET NOT NULL;

-- Step 4: Drop the single row constraint
ALTER TABLE leadsmart_pico_count_cache 
DROP CONSTRAINT IF EXISTS single_row_cache;

-- Step 5: Drop existing primary key
ALTER TABLE leadsmart_pico_count_cache 
DROP CONSTRAINT IF EXISTS leadsmart_pico_count_cache_pkey;

-- Step 6: Change cache_id to SERIAL (auto-increment)
-- First create a new sequence
CREATE SEQUENCE IF NOT EXISTS leadsmart_pico_count_cache_cache_id_seq;

-- Alter the column to use the sequence
ALTER TABLE leadsmart_pico_count_cache 
ALTER COLUMN cache_id SET DEFAULT nextval('leadsmart_pico_count_cache_cache_id_seq');

-- Set the sequence ownership
ALTER SEQUENCE leadsmart_pico_count_cache_cache_id_seq 
OWNED BY leadsmart_pico_count_cache.cache_id;

-- Step 7: Re-add primary key on cache_id
ALTER TABLE leadsmart_pico_count_cache 
ADD PRIMARY KEY (cache_id);

-- Step 8: Add unique constraint on user_id (one cache per user)
ALTER TABLE leadsmart_pico_count_cache 
ADD CONSTRAINT unique_user_cache UNIQUE (user_id);

-- Update the comment
COMMENT ON TABLE leadsmart_pico_count_cache IS 'Cache for LeadSmart Skylab tile table counts. One row per user stores all entity counts in JSONB format to avoid 300+ count queries on page load.';
COMMENT ON COLUMN leadsmart_pico_count_cache.user_id IS 'User who owns this cache. Each user has their own independent cache.';

-- Verification
SELECT 'Pico Count Cache altered successfully - now supports one row per user' as status;

-- Show current structure
SELECT 
  column_name, 
  data_type, 
  is_nullable,
  column_default
FROM information_schema.columns
WHERE table_name = 'leadsmart_pico_count_cache'
ORDER BY ordinal_position;

-- Show constraints
SELECT 
  conname as constraint_name,
  contype as constraint_type,
  pg_get_constraintdef(oid) as definition
FROM pg_constraint
WHERE conrelid = 'leadsmart_pico_count_cache'::regclass;

