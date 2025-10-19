-- Create table for tracking LeadSmart transform attempts
-- This replaces localStorage with persistent database storage

CREATE TABLE IF NOT EXISTS leadsmart_transform_attempts (
  -- Primary key
  attempt_id SERIAL PRIMARY KEY,
  
  -- User tracking
  user_id UUID NOT NULL,
  
  -- Timing
  start_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  end_time TIMESTAMPTZ,
  last_update_time TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  
  -- Status
  status TEXT NOT NULL CHECK (status IN ('in_progress', 'completed', 'failed', 'stalled')),
  
  -- Source selection (HOW user selected data)
  selection_type TEXT NOT NULL CHECK (selection_type IN ('rel_release_id', 'rel_subsheet_id', 'rel_subpart_id')),
  selection_id INTEGER NOT NULL,
  
  -- Entity info (for display purposes)
  entity_type TEXT NOT NULL CHECK (entity_type IN ('release', 'subsheet', 'subpart')),
  entity_id INTEGER NOT NULL,
  
  -- Progress tracking
  total_rows INTEGER NOT NULL,
  processed_rows INTEGER DEFAULT 0,
  current_batch INTEGER DEFAULT 0,
  total_batches INTEGER NOT NULL,
  
  -- Results
  groups_created INTEGER DEFAULT 0,
  transformed_records_new INTEGER DEFAULT 0,
  transformed_records_updated INTEGER DEFAULT 0,
  relations_created INTEGER DEFAULT 0,
  skipped_rows INTEGER DEFAULT 0,
  already_transformed_rows INTEGER DEFAULT 0,
  
  -- Error handling
  error_message TEXT,
  error_details JSONB,
  
  -- Detailed logs (JSONB array of log entries)
  logs JSONB DEFAULT '[]'::jsonb,
  
  -- Resume tracking
  last_processed_batch_start_row INTEGER,
  last_processed_batch_end_row INTEGER,
  resume_from_batch INTEGER,
  
  -- Performance metrics
  rows_per_second NUMERIC,
  avg_batch_time_seconds NUMERIC,
  estimated_completion_time TIMESTAMPTZ,
  
  -- Metadata
  created_at TIMESTAMPTZ DEFAULT NOW(),
  updated_at TIMESTAMPTZ DEFAULT NOW()
);

-- Indexes for performance
CREATE INDEX idx_transform_user_id ON leadsmart_transform_attempts(user_id);
CREATE INDEX idx_transform_status ON leadsmart_transform_attempts(status);
CREATE INDEX idx_transform_start_time ON leadsmart_transform_attempts(start_time DESC);
CREATE INDEX idx_transform_entity ON leadsmart_transform_attempts(entity_type, entity_id);
CREATE INDEX idx_transform_selection ON leadsmart_transform_attempts(selection_type, selection_id);
CREATE INDEX idx_transform_in_progress ON leadsmart_transform_attempts(status, last_update_time) 
  WHERE status = 'in_progress';

-- Function to automatically update updated_at timestamp
CREATE OR REPLACE FUNCTION update_transform_attempts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Trigger to auto-update updated_at
CREATE TRIGGER trigger_update_transform_attempts_updated_at
  BEFORE UPDATE ON leadsmart_transform_attempts
  FOR EACH ROW
  EXECUTE FUNCTION update_transform_attempts_updated_at();

-- Function to detect stalled transforms
CREATE OR REPLACE FUNCTION detect_stalled_transforms()
RETURNS INTEGER AS $$
DECLARE
  stalled_count INTEGER;
BEGIN
  -- Mark transforms as stalled if no update for 5 minutes
  UPDATE leadsmart_transform_attempts
  SET status = 'stalled'
  WHERE status = 'in_progress'
    AND last_update_time < NOW() - INTERVAL '5 minutes';
  
  GET DIAGNOSTICS stalled_count = ROW_COUNT;
  RETURN stalled_count;
END;
$$ LANGUAGE plpgsql;

-- View for active transforms
CREATE OR REPLACE VIEW active_transform_attempts AS
SELECT 
  attempt_id,
  user_id,
  start_time,
  last_update_time,
  status,
  entity_type,
  entity_id,
  selection_type,
  selection_id,
  total_rows,
  processed_rows,
  current_batch,
  total_batches,
  ROUND((processed_rows::numeric / NULLIF(total_rows, 0) * 100), 2) as progress_percentage,
  groups_created,
  transformed_records_new + transformed_records_updated as total_transformed_records,
  relations_created,
  EXTRACT(EPOCH FROM (COALESCE(end_time, NOW()) - start_time)) as duration_seconds,
  EXTRACT(EPOCH FROM (NOW() - last_update_time)) as seconds_since_update
FROM leadsmart_transform_attempts
WHERE status IN ('in_progress', 'stalled')
ORDER BY start_time DESC;

-- View for transform history
CREATE OR REPLACE VIEW transform_history_summary AS
SELECT 
  DATE(start_time) as transform_date,
  entity_type,
  COUNT(*) as total_attempts,
  COUNT(*) FILTER (WHERE status = 'completed') as completed,
  COUNT(*) FILTER (WHERE status = 'failed') as failed,
  COUNT(*) FILTER (WHERE status = 'stalled') as stalled,
  SUM(total_rows) as total_rows_processed,
  SUM(transformed_records_new) as total_new_records,
  AVG(EXTRACT(EPOCH FROM (end_time - start_time))) FILTER (WHERE status = 'completed') as avg_duration_seconds
FROM leadsmart_transform_attempts
GROUP BY DATE(start_time), entity_type
ORDER BY transform_date DESC, entity_type;

-- Comments for documentation
COMMENT ON TABLE leadsmart_transform_attempts IS 'Tracks all transform attempts from leadsmart_zip_based_data to leadsmart_transformed with detailed progress and resume capability';
COMMENT ON COLUMN leadsmart_transform_attempts.user_id IS 'Foreign key to users table - tracks which user initiated the transform';
COMMENT ON COLUMN leadsmart_transform_attempts.selection_type IS 'How user selected data: rel_release_id, rel_subsheet_id, or rel_subpart_id';
COMMENT ON COLUMN leadsmart_transform_attempts.selection_id IS 'The ID value that was used in the WHERE clause';
COMMENT ON COLUMN leadsmart_transform_attempts.entity_type IS 'Display name for the entity type (release, subsheet, subpart)';
COMMENT ON COLUMN leadsmart_transform_attempts.resume_from_batch IS 'If resuming, which batch to start from';
COMMENT ON COLUMN leadsmart_transform_attempts.logs IS 'JSONB array of timestamped log entries for debugging';

-- Grant permissions (adjust as needed for your RLS policies)
-- ALTER TABLE leadsmart_transform_attempts ENABLE ROW LEVEL SECURITY;

-- Example RLS policy (users can only see their own attempts)
-- CREATE POLICY "Users can view own transform attempts"
--   ON leadsmart_transform_attempts FOR SELECT
--   USING (auth.uid() = user_id);

-- CREATE POLICY "Users can insert own transform attempts"
--   ON leadsmart_transform_attempts FOR INSERT
--   WITH CHECK (auth.uid() = user_id);

-- CREATE POLICY "Users can update own transform attempts"
--   ON leadsmart_transform_attempts FOR UPDATE
--   USING (auth.uid() = user_id);

-- Verification queries
SELECT 'Table created successfully' as status;

SELECT table_name, column_name, data_type, is_nullable
FROM information_schema.columns
WHERE table_name = 'leadsmart_transform_attempts'
ORDER BY ordinal_position;

SELECT indexname, indexdef
FROM pg_indexes
WHERE tablename = 'leadsmart_transform_attempts';

