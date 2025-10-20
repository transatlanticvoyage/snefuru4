-- Create baobab_transform_attempts table for monitoring transform operations
CREATE TABLE IF NOT EXISTS baobab_transform_attempts (
  baobab_attempt_id SERIAL PRIMARY KEY,
  user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  status VARCHAR(20) NOT NULL DEFAULT 'pending' CHECK (status IN ('pending', 'in_progress', 'completed', 'failed', 'cancelled', 'stalled')),
  operation_type VARCHAR(50) NOT NULL DEFAULT 'transform',
  created_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  started_at TIMESTAMPTZ,
  completed_at TIMESTAMPTZ,
  last_activity_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  current_phase VARCHAR(100),
  overall_progress DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (overall_progress >= 0 AND overall_progress <= 100),
  phase_progress DECIMAL(5,2) NOT NULL DEFAULT 0 CHECK (phase_progress >= 0 AND phase_progress <= 100),
  rows_processed INTEGER NOT NULL DEFAULT 0 CHECK (rows_processed >= 0),
  rows_validated INTEGER NOT NULL DEFAULT 0 CHECK (rows_validated >= 0),
  rows_transformed INTEGER NOT NULL DEFAULT 0 CHECK (rows_transformed >= 0),
  rows_inserted INTEGER NOT NULL DEFAULT 0 CHECK (rows_inserted >= 0),
  rows_updated INTEGER NOT NULL DEFAULT 0 CHECK (rows_updated >= 0),
  rows_failed INTEGER NOT NULL DEFAULT 0 CHECK (rows_failed >= 0),
  operations_per_second DECIMAL(10,2) NOT NULL DEFAULT 0 CHECK (operations_per_second >= 0),
  estimated_completion_time TIMESTAMPTZ,
  actual_duration_ms INTEGER CHECK (actual_duration_ms >= 0),
  error_message TEXT,
  error_details JSONB,
  error_count INTEGER NOT NULL DEFAULT 0 CHECK (error_count >= 0),
  batch_size INTEGER NOT NULL DEFAULT 1000 CHECK (batch_size > 0),
  timeout_minutes INTEGER NOT NULL DEFAULT 30 CHECK (timeout_minutes > 0),
  auto_resume BOOLEAN NOT NULL DEFAULT FALSE,
  stall_threshold_minutes INTEGER NOT NULL DEFAULT 5 CHECK (stall_threshold_minutes > 0),
  is_stalled BOOLEAN NOT NULL DEFAULT FALSE,
  stall_detected_at TIMESTAMPTZ,
  resume_data JSONB,
  checkpoint_data JSONB,
  operation_logs JSONB NOT NULL DEFAULT '[]'::jsonb,
  source_table VARCHAR(100),
  target_table VARCHAR(100),
  transform_type VARCHAR(50),
  filter_criteria JSONB,
  transform_summary JSONB,
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- Create indexes for performance
CREATE INDEX IF NOT EXISTS idx_baobab_attempts_user_id ON baobab_transform_attempts(user_id);
CREATE INDEX IF NOT EXISTS idx_baobab_attempts_status ON baobab_transform_attempts(status);
CREATE INDEX IF NOT EXISTS idx_baobab_attempts_created_at ON baobab_transform_attempts(created_at DESC);
CREATE INDEX IF NOT EXISTS idx_baobab_attempts_last_activity ON baobab_transform_attempts(last_activity_at DESC);

-- Create updated_at trigger
CREATE OR REPLACE FUNCTION update_baobab_transform_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS trigger_baobab_transform_attempts_updated_at ON baobab_transform_attempts;
CREATE TRIGGER trigger_baobab_transform_attempts_updated_at
  BEFORE UPDATE ON baobab_transform_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_baobab_transform_attempts_updated_at();

-- Enable Row Level Security
ALTER TABLE baobab_transform_attempts ENABLE ROW LEVEL SECURITY;

-- Create RLS policies
DROP POLICY IF EXISTS "Users can view their own baobab transform attempts" ON baobab_transform_attempts;
CREATE POLICY "Users can view their own baobab transform attempts"
  ON baobab_transform_attempts
  FOR SELECT
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can insert their own baobab transform attempts" ON baobab_transform_attempts;
CREATE POLICY "Users can insert their own baobab transform attempts"
  ON baobab_transform_attempts
  FOR INSERT
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "Users can update their own baobab transform attempts" ON baobab_transform_attempts;
CREATE POLICY "Users can update their own baobab transform attempts"
  ON baobab_transform_attempts
  FOR UPDATE
  USING (auth.uid() = user_id);