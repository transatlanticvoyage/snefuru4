-- Disable RLS and remove all policies for indusjar symbol system

-- Drop all policies for user_symbol_definitions table
DROP POLICY IF EXISTS "Users can view their own symbol definitions" ON user_symbol_definitions;
DROP POLICY IF EXISTS "Users can insert their own symbol definitions" ON user_symbol_definitions;
DROP POLICY IF EXISTS "Users can update their own symbol definitions" ON user_symbol_definitions;
DROP POLICY IF EXISTS "Users can delete their own symbol definitions" ON user_symbol_definitions;
DROP POLICY IF EXISTS "Users can manage their own symbol definitions" ON user_symbol_definitions;

-- Drop all policies for industries_user_meta table  
DROP POLICY IF EXISTS "Users can view their own industry metadata" ON industries_user_meta;
DROP POLICY IF EXISTS "Users can insert their own industry metadata" ON industries_user_meta;
DROP POLICY IF EXISTS "Users can update their own industry metadata" ON industries_user_meta;
DROP POLICY IF EXISTS "Users can delete their own industry metadata" ON industries_user_meta;
DROP POLICY IF EXISTS "Users can manage their own industry metadata" ON industries_user_meta;

-- Disable RLS entirely on both tables
ALTER TABLE user_symbol_definitions DISABLE ROW LEVEL SECURITY;
ALTER TABLE industries_user_meta DISABLE ROW LEVEL SECURITY;

-- Also disable RLS on industries table if it has any
ALTER TABLE industries DISABLE ROW LEVEL SECURITY;