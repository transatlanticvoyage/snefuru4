-- Create atrium_services table

CREATE TABLE atrium_services (
    atrservice_id SERIAL PRIMARY KEY,
    atrservice_name TEXT,
    created_by UUID,
    created_at TIMESTAMP DEFAULT NOW(),
    updated_at TIMESTAMP DEFAULT NOW()
);

-- Create an index on created_by for faster lookups
CREATE INDEX idx_atrium_services_created_by ON atrium_services(created_by);

-- Create a trigger to automatically update the updated_at timestamp
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_atrium_services_updated_at 
    BEFORE UPDATE ON atrium_services 
    FOR EACH ROW 
    EXECUTE FUNCTION update_updated_at_column();

-- Optional: Add a foreign key constraint if you want to ensure created_by references the auth.users table
-- ALTER TABLE atrium_services 
-- ADD CONSTRAINT fk_atrium_services_created_by 
-- FOREIGN KEY (created_by) 
-- REFERENCES auth.users(id);

-- Optional: Enable RLS if you want row-level security
-- ALTER TABLE atrium_services ENABLE ROW LEVEL SECURITY;

-- Optional: Create RLS policies (uncomment if you enable RLS)
-- CREATE POLICY "Users can view all services" ON atrium_services
--     FOR SELECT
--     USING (true);

-- CREATE POLICY "Users can insert their own services" ON atrium_services
--     FOR INSERT
--     WITH CHECK (auth.uid() = created_by);

-- CREATE POLICY "Users can update their own services" ON atrium_services
--     FOR UPDATE
--     USING (auth.uid() = created_by)
--     WITH CHECK (auth.uid() = created_by);

-- CREATE POLICY "Users can delete their own services" ON atrium_services
--     FOR DELETE
--     USING (auth.uid() = created_by);