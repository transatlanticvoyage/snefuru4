-- Create table to track DFS migration status
CREATE TABLE dfs_migration_status (
    id INTEGER PRIMARY KEY DEFAULT 1,
    total_sitesglub_records INTEGER DEFAULT 0,
    processed_records INTEGER DEFAULT 0,
    created_sitesdfs_records INTEGER DEFAULT 0,
    api_calls_made INTEGER DEFAULT 0,
    api_calls_failed INTEGER DEFAULT 0,
    total_cost DECIMAL(10,4) DEFAULT 0,
    status TEXT DEFAULT 'not_started', -- 'not_started', 'running', 'completed', 'paused', 'error'
    current_batch INTEGER DEFAULT 1,
    error_message TEXT,
    started_at TIMESTAMP,
    last_updated TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    
    -- Constraint to ensure only one status record exists
    CONSTRAINT single_migration_status CHECK (id = 1)
);

-- Create trigger to auto-update last_updated timestamp
CREATE OR REPLACE FUNCTION update_dfs_migration_status_updated_at()
RETURNS TRIGGER AS $$
BEGIN
    NEW.last_updated = CURRENT_TIMESTAMP;
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER trigger_dfs_migration_status_updated_at
    BEFORE UPDATE ON dfs_migration_status
    FOR EACH ROW
    EXECUTE FUNCTION update_dfs_migration_status_updated_at();