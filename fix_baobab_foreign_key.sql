-- Fix the foreign key constraint for baobab_transform_attempts
-- The constraint currently references users(id) but should reference auth.users(id)

-- Drop the existing foreign key constraint
ALTER TABLE baobab_transform_attempts 
DROP CONSTRAINT IF EXISTS baobab_transform_attempts_user_id_fkey;

-- Add the correct foreign key constraint referencing auth.users
ALTER TABLE baobab_transform_attempts 
ADD CONSTRAINT baobab_transform_attempts_user_id_fkey 
FOREIGN KEY (user_id) REFERENCES auth.users(id) ON DELETE CASCADE;

-- Verify the constraint was created correctly
SELECT 
    conname AS constraint_name,
    conrelid::regclass AS table_name,
    confrelid::regclass AS referenced_table,
    a.attname AS column_name,
    af.attname AS referenced_column
FROM pg_constraint c
JOIN pg_attribute a ON a.attrelid = c.conrelid AND a.attnum = ANY(c.conkey)
JOIN pg_attribute af ON af.attrelid = c.confrelid AND af.attnum = ANY(c.confkey)
WHERE c.conname = 'baobab_transform_attempts_user_id_fkey';