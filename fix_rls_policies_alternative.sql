-- Alternative version if auth_id is text type in users table

-- Drop existing policies if any
DROP POLICY IF EXISTS "Users can manage their own symbol definitions" ON user_symbol_definitions;
DROP POLICY IF EXISTS "Users can view their own symbol definitions" ON user_symbol_definitions;
DROP POLICY IF EXISTS "Users can insert their own symbol definitions" ON user_symbol_definitions;
DROP POLICY IF EXISTS "Users can update their own symbol definitions" ON user_symbol_definitions;
DROP POLICY IF EXISTS "Users can delete their own symbol definitions" ON user_symbol_definitions;
DROP POLICY IF EXISTS "Users can manage their own industry metadata" ON industries_user_meta;
DROP POLICY IF EXISTS "Users can view their own industry metadata" ON industries_user_meta;
DROP POLICY IF EXISTS "Users can insert their own industry metadata" ON industries_user_meta;
DROP POLICY IF EXISTS "Users can update their own industry metadata" ON industries_user_meta;
DROP POLICY IF EXISTS "Users can delete their own industry metadata" ON industries_user_meta;

-- Create policies for user_symbol_definitions table
CREATE POLICY "Users can view their own symbol definitions"
ON user_symbol_definitions
FOR SELECT
USING (auth.uid()::text = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own symbol definitions"
ON user_symbol_definitions
FOR INSERT
WITH CHECK (auth.uid()::text = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own symbol definitions"
ON user_symbol_definitions
FOR UPDATE
USING (auth.uid()::text = (SELECT auth_id FROM users WHERE id = user_id))
WITH CHECK (auth.uid()::text = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own symbol definitions"
ON user_symbol_definitions
FOR DELETE
USING (auth.uid()::text = (SELECT auth_id FROM users WHERE id = user_id));

-- Create policies for industries_user_meta table
CREATE POLICY "Users can view their own industry metadata"
ON industries_user_meta
FOR SELECT
USING (auth.uid()::text = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "Users can insert their own industry metadata"
ON industries_user_meta
FOR INSERT
WITH CHECK (auth.uid()::text = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "Users can update their own industry metadata"
ON industries_user_meta
FOR UPDATE
USING (auth.uid()::text = (SELECT auth_id FROM users WHERE id = user_id))
WITH CHECK (auth.uid()::text = (SELECT auth_id FROM users WHERE id = user_id));

CREATE POLICY "Users can delete their own industry metadata"
ON industries_user_meta
FOR DELETE
USING (auth.uid()::text = (SELECT auth_id FROM users WHERE id = user_id));

-- Make sure RLS is enabled
ALTER TABLE user_symbol_definitions ENABLE ROW LEVEL SECURITY;
ALTER TABLE industries_user_meta ENABLE ROW LEVEL SECURITY;