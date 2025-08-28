-- Add new columns to host_account table
-- Run this SQL in your Supabase SQL Editor

-- Add hostacct_api_secret column
ALTER TABLE host_account 
ADD COLUMN IF NOT EXISTS hostacct_api_secret TEXT;

-- Add api_management_url column  
ALTER TABLE host_account 
ADD COLUMN IF NOT EXISTS api_management_url TEXT;

-- Add comments for documentation
COMMENT ON COLUMN host_account.hostacct_api_secret IS 'API secret/key for host account management';
COMMENT ON COLUMN host_account.api_management_url IS 'URL for API management interface of the hosting provider';