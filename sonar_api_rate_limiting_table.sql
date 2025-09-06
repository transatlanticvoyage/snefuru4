-- SQL to create rate limiting table for Sonar API
-- Run this in your Supabase SQL editor

CREATE TABLE IF NOT EXISTS api_usage_tracking (
    id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    api_endpoint VARCHAR(100) NOT NULL,
    date DATE NOT NULL,
    call_count INTEGER DEFAULT 1,
    created_at TIMESTAMPTZ DEFAULT NOW(),
    updated_at TIMESTAMPTZ DEFAULT NOW(),
    
    -- Ensure one record per user per endpoint per day
    UNIQUE(user_id, api_endpoint, date)
);

-- Index for fast lookups
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_lookup 
ON api_usage_tracking(user_id, api_endpoint, date);

-- Index for cleanup/monitoring
CREATE INDEX IF NOT EXISTS idx_api_usage_tracking_date 
ON api_usage_tracking(date);

-- RLS (Row Level Security) - users can only see their own usage
ALTER TABLE api_usage_tracking ENABLE ROW LEVEL SECURITY;

CREATE POLICY "Users can only see their own API usage" ON api_usage_tracking
    FOR ALL USING (auth.uid() = (SELECT auth_id FROM users WHERE id = user_id));

-- Example queries:

-- Check current usage for a user:
-- SELECT * FROM api_usage_tracking 
-- WHERE user_id = 'your-user-id' 
-- AND api_endpoint = 'sonar_site_data' 
-- AND date = CURRENT_DATE;

-- Clean up old records (run monthly):
-- DELETE FROM api_usage_tracking WHERE date < CURRENT_DATE - INTERVAL '30 days';

-- Monitor API usage:
-- SELECT 
--   api_endpoint,
--   date,
--   SUM(call_count) as total_calls,
--   COUNT(DISTINCT user_id) as unique_users
-- FROM api_usage_tracking 
-- WHERE date >= CURRENT_DATE - INTERVAL '7 days'
-- GROUP BY api_endpoint, date
-- ORDER BY date DESC, total_calls DESC;