-- Setup error_logs table to fix the constant 500 errors from /api/error-logs/get-logs
-- Run this SQL in your Supabase SQL Editor

-- Create error_logs table
CREATE TABLE IF NOT EXISTS error_logs (
  id UUID DEFAULT gen_random_uuid() PRIMARY KEY,
  user_id UUID REFERENCES users(id) ON DELETE CASCADE,
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  level TEXT NOT NULL CHECK (level IN ('error', 'warning', 'info', 'debug')),
  category TEXT NOT NULL,
  message TEXT NOT NULL,
  details JSONB,
  stack_trace TEXT,
  batch_id TEXT,
  plan_id TEXT,
  job_id TEXT,
  created_at TIMESTAMPTZ DEFAULT NOW()
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_error_logs_user_id ON error_logs(user_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_timestamp ON error_logs(timestamp);
CREATE INDEX IF NOT EXISTS idx_error_logs_level ON error_logs(level);
CREATE INDEX IF NOT EXISTS idx_error_logs_category ON error_logs(category);
CREATE INDEX IF NOT EXISTS idx_error_logs_batch_id ON error_logs(batch_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_plan_id ON error_logs(plan_id);
CREATE INDEX IF NOT EXISTS idx_error_logs_job_id ON error_logs(job_id);

-- Enable RLS (Row Level Security)
ALTER TABLE error_logs ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
CREATE POLICY "Users can view their own error logs" ON error_logs
  FOR SELECT USING (auth.uid()::text = (
    SELECT auth_id FROM users WHERE id = error_logs.user_id
  ));

CREATE POLICY "Users can insert their own error logs" ON error_logs
  FOR INSERT WITH CHECK (auth.uid()::text = (
    SELECT auth_id FROM users WHERE id = error_logs.user_id
  ));

CREATE POLICY "Users can delete their own error logs" ON error_logs
  FOR DELETE USING (auth.uid()::text = (
    SELECT auth_id FROM users WHERE id = error_logs.user_id
  ));

-- Add some test data (optional)
-- INSERT INTO error_logs (user_id, level, category, message, details) VALUES
-- (
--   (SELECT id FROM users LIMIT 1),
--   'info',
--   'system_setup',
--   'Error logs table created successfully',
--   '{"setup_time": "2024-06-03", "table_created": true}'
-- ); 