-- Check the constraints on our tables

-- Check industries_user_meta table structure and constraints
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'industries_user_meta';

-- Check user_symbol_definitions table structure and constraints  
SELECT 
    tc.constraint_name, 
    tc.constraint_type,
    kcu.column_name
FROM information_schema.table_constraints tc
JOIN information_schema.key_column_usage kcu 
    ON tc.constraint_name = kcu.constraint_name
WHERE tc.table_name = 'user_symbol_definitions';

-- Check if there are any existing records that might cause conflicts
SELECT user_id, fk_industry_id, COUNT(*) 
FROM industries_user_meta 
GROUP BY user_id, fk_industry_id 
HAVING COUNT(*) > 1;