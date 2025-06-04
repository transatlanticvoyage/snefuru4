-- Add missing columns to ywp_content table for WordPress sync

-- First, let's see what columns currently exist
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ywp_content' 
ORDER BY ordinal_position;

-- Add missing columns if they don't exist
DO $$ 
BEGIN
    -- Add site_url column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'site_url') THEN
        ALTER TABLE ywp_content ADD COLUMN site_url TEXT NOT NULL DEFAULT '';
    END IF;

    -- Add post_id column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'post_id') THEN
        ALTER TABLE ywp_content ADD COLUMN post_id INTEGER NOT NULL DEFAULT 0;
    END IF;

    -- Add post_title column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'post_title') THEN
        ALTER TABLE ywp_content ADD COLUMN post_title TEXT DEFAULT '';
    END IF;

    -- Add post_content column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'post_content') THEN
        ALTER TABLE ywp_content ADD COLUMN post_content TEXT DEFAULT '';
    END IF;

    -- Add post_excerpt column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'post_excerpt') THEN
        ALTER TABLE ywp_content ADD COLUMN post_excerpt TEXT DEFAULT '';
    END IF;

    -- Add post_status column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'post_status') THEN
        ALTER TABLE ywp_content ADD COLUMN post_status TEXT DEFAULT 'publish';
    END IF;

    -- Add post_type column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'post_type') THEN
        ALTER TABLE ywp_content ADD COLUMN post_type TEXT DEFAULT 'post';
    END IF;

    -- Add post_date column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'post_date') THEN
        ALTER TABLE ywp_content ADD COLUMN post_date TIMESTAMP DEFAULT NOW();
    END IF;

    -- Add post_modified column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'post_modified') THEN
        ALTER TABLE ywp_content ADD COLUMN post_modified TIMESTAMP DEFAULT NOW();
    END IF;

    -- Add post_author column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'post_author') THEN
        ALTER TABLE ywp_content ADD COLUMN post_author INTEGER DEFAULT 1;
    END IF;

    -- Add post_slug column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'post_slug') THEN
        ALTER TABLE ywp_content ADD COLUMN post_slug TEXT DEFAULT '';
    END IF;

    -- Add sync_method column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'sync_method') THEN
        ALTER TABLE ywp_content ADD COLUMN sync_method TEXT DEFAULT 'plugin_api';
    END IF;

    -- Add raw_metadata column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'raw_metadata') THEN
        ALTER TABLE ywp_content ADD COLUMN raw_metadata JSONB DEFAULT '{}';
    END IF;

    -- Add sync_version column
    IF NOT EXISTS (SELECT 1 FROM information_schema.columns WHERE table_name = 'ywp_content' AND column_name = 'sync_version') THEN
        ALTER TABLE ywp_content ADD COLUMN sync_version INTEGER DEFAULT 1;
    END IF;
END $$;

-- Check current ywp_content table structure
SELECT column_name, data_type, is_nullable 
FROM information_schema.columns 
WHERE table_name = 'ywp_content' 
ORDER BY ordinal_position;

-- Add unique constraint for fk_site_id + post_id (for upserts)
-- This is the only thing we need to add since all columns already exist
DO $$
BEGIN
    IF NOT EXISTS (SELECT 1 FROM pg_constraint WHERE conname = 'ywp_content_fk_site_id_post_id_key') THEN
        ALTER TABLE ywp_content ADD CONSTRAINT ywp_content_fk_site_id_post_id_key UNIQUE (fk_site_id, post_id);
        RAISE NOTICE 'Added unique constraint on fk_site_id, post_id';
    ELSE
        RAISE NOTICE 'Unique constraint already exists';
    END IF;
END $$;

-- Create useful indexes if they don't exist
CREATE INDEX IF NOT EXISTS idx_ywp_content_fk_site_id ON ywp_content (fk_site_id);
CREATE INDEX IF NOT EXISTS idx_ywp_content_post_type ON ywp_content (post_type);
CREATE INDEX IF NOT EXISTS idx_ywp_content_sync_method ON ywp_content (sync_method);
CREATE INDEX IF NOT EXISTS idx_ywp_content_post_status ON ywp_content (post_status);

-- Show any existing constraints
SELECT conname, contype, pg_get_constraintdef(oid) 
FROM pg_constraint 
WHERE conrelid = 'ywp_content'::regclass;

-- Show final table structure
SELECT column_name, data_type, is_nullable, column_default 
FROM information_schema.columns 
WHERE table_name = 'ywp_content' 
ORDER BY ordinal_position; 