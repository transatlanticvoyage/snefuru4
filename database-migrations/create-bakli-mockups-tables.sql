-- Create bakli_mockups system tables
-- Run this SQL in your Supabase database

-- Main table for bakli mockups
CREATE TABLE bakli_mockups (
    bakli_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_user_id UUID NOT NULL REFERENCES users(id) ON DELETE CASCADE,
    bakli_name VARCHAR(255) NOT NULL,
    bakli_description TEXT,
    bakli_content TEXT, -- HTML content
    bakli_css TEXT, -- CSS styles
    bakli_status VARCHAR(50) DEFAULT 'draft', -- draft, published, archived
    bakli_tags TEXT[], -- Array of tags for categorization
    is_public BOOLEAN DEFAULT false, -- Whether mockup is publicly viewable
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Metadata fields
    bakli_version INTEGER DEFAULT 1,
    bakli_preview_image_url TEXT, -- Optional screenshot/preview
    bakli_notes TEXT, -- Internal notes
    
    -- Performance/usage tracking
    view_count INTEGER DEFAULT 0,
    last_viewed_at TIMESTAMP WITH TIME ZONE,
    
    -- Organization
    bakli_folder VARCHAR(255), -- Optional folder/category
    bakli_priority INTEGER DEFAULT 0, -- For sorting
    
    CONSTRAINT bakli_mockups_name_length CHECK (LENGTH(bakli_name) >= 1),
    CONSTRAINT bakli_mockups_status_valid CHECK (bakli_status IN ('draft', 'published', 'archived'))
);

-- Indexes for performance
CREATE INDEX idx_bakli_mockups_user_id ON bakli_mockups(fk_user_id);
CREATE INDEX idx_bakli_mockups_status ON bakli_mockups(bakli_status);
CREATE INDEX idx_bakli_mockups_created_at ON bakli_mockups(created_at DESC);
CREATE INDEX idx_bakli_mockups_updated_at ON bakli_mockups(updated_at DESC);

-- Version history table for tracking changes
CREATE TABLE bakli_mockup_versions (
    version_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_bakli_id UUID NOT NULL REFERENCES bakli_mockups(bakli_id) ON DELETE CASCADE,
    version_number INTEGER NOT NULL,
    bakli_content TEXT,
    bakli_css TEXT,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    change_notes TEXT
);

-- Sharing/collaboration table
CREATE TABLE bakli_mockup_shares (
    share_id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
    fk_bakli_id UUID NOT NULL REFERENCES bakli_mockups(bakli_id) ON DELETE CASCADE,
    fk_shared_with_user_id UUID REFERENCES users(id) ON DELETE CASCADE,
    share_type VARCHAR(50) DEFAULT 'view', -- view, edit, admin
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    expires_at TIMESTAMP WITH TIME ZONE
);

-- RLS Policies
ALTER TABLE bakli_mockups ENABLE ROW LEVEL SECURITY;
ALTER TABLE bakli_mockup_versions ENABLE ROW LEVEL SECURITY;
ALTER TABLE bakli_mockup_shares ENABLE ROW LEVEL SECURITY;

-- Policy: Users can only see their own mockups
CREATE POLICY "Users can view own mockups" ON bakli_mockups
    FOR SELECT USING (fk_user_id = auth.uid());

-- Policy: Users can insert their own mockups
CREATE POLICY "Users can insert own mockups" ON bakli_mockups
    FOR INSERT WITH CHECK (fk_user_id = auth.uid());

-- Policy: Users can update their own mockups
CREATE POLICY "Users can update own mockups" ON bakli_mockups
    FOR UPDATE USING (fk_user_id = auth.uid());

-- Policy: Users can delete their own mockups
CREATE POLICY "Users can delete own mockups" ON bakli_mockups
    FOR DELETE USING (fk_user_id = auth.uid());

-- Similar policies for versions table
CREATE POLICY "Users can view own mockup versions" ON bakli_mockup_versions
    FOR SELECT USING (fk_bakli_id IN (SELECT bakli_id FROM bakli_mockups WHERE fk_user_id = auth.uid()));

CREATE POLICY "Users can insert own mockup versions" ON bakli_mockup_versions
    FOR INSERT WITH CHECK (fk_bakli_id IN (SELECT bakli_id FROM bakli_mockups WHERE fk_user_id = auth.uid()));