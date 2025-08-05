-- Create junction table for sitespren and sitespren_tags many-to-many relationship
CREATE TABLE IF NOT EXISTS sitespren_site_tags (
    id SERIAL PRIMARY KEY,
    sitespren_id VARCHAR REFERENCES sitespren(id) ON DELETE CASCADE,
    tag_id INTEGER REFERENCES sitespren_tags(tag_id) ON DELETE CASCADE,
    assigned_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    assigned_by VARCHAR, -- Could reference users table if needed
    UNIQUE(sitespren_id, tag_id) -- Prevent duplicate assignments
);

-- Create indexes for better performance
CREATE INDEX IF NOT EXISTS idx_sitespren_site_tags_sitespren_id ON sitespren_site_tags(sitespren_id);
CREATE INDEX IF NOT EXISTS idx_sitespren_site_tags_tag_id ON sitespren_site_tags(tag_id);

-- Add comments for documentation
COMMENT ON TABLE sitespren_site_tags IS 'Junction table linking sitespren sites to sitespren_tags for many-to-many relationships';
COMMENT ON COLUMN sitespren_site_tags.sitespren_id IS 'Foreign key reference to sitespren.id';
COMMENT ON COLUMN sitespren_site_tags.tag_id IS 'Foreign key reference to sitespren_tags.tag_id';
COMMENT ON COLUMN sitespren_site_tags.assigned_at IS 'Timestamp when the tag was assigned to the site';
COMMENT ON COLUMN sitespren_site_tags.assigned_by IS 'User who assigned this tag (optional)';