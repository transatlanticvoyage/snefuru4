-- Migration: Add is_admin column to users table
-- Run this in Supabase SQL Editor

-- Add the is_admin column
ALTER TABLE public.users 
ADD COLUMN IF NOT EXISTS is_admin BOOLEAN DEFAULT FALSE;

-- Add a comment for clarity
COMMENT ON COLUMN public.users.is_admin IS 'Determines if user has admin privileges';

-- Create an index for performance (partial index only for admin users)
CREATE INDEX IF NOT EXISTS idx_users_is_admin ON public.users(is_admin) 
WHERE is_admin = TRUE;

-- Example: Set your first admin user (replace with your actual email)
-- UPDATE public.users 
-- SET is_admin = TRUE 
-- WHERE email = 'your-email@example.com';

-- Display current admin users
SELECT id, email, is_admin, created_at 
FROM public.users 
WHERE is_admin = TRUE;