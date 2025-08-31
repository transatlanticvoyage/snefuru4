-- ADDRESSPREN SYSTEM DATABASE SCHEMA
-- Mirroring established patterns from keywordshub and redditurlsvat systems
-- Date: 2025-08-30

-- =====================================================
-- 1. MAIN ADDRESSPREN TABLE (like keywordshub, redditurlsvat)
-- =====================================================
CREATE TABLE IF NOT EXISTS addresspren (
    address_id SERIAL PRIMARY KEY,
    address_datum TEXT NOT NULL, -- The main address data (like keyword_datum)
    
    -- Address components
    street_number TEXT,
    street_name TEXT,
    apartment_unit TEXT,
    city TEXT,
    state_code TEXT(2),
    state_full TEXT,
    zip_code TEXT,
    country_code TEXT(2),
    country_full TEXT,
    
    -- Geocoding data
    latitude DECIMAL(10, 8),
    longitude DECIMAL(11, 8),
    geocoded_at TIMESTAMP WITH TIME ZONE,
    geocode_provider TEXT, -- google, here, etc.
    geocode_confidence DECIMAL(3, 2), -- 0.00 to 1.00
    
    -- Validation and formatting
    address_formatted TEXT, -- Standardized formatted version
    address_validation_status TEXT, -- valid, invalid, partial, unknown
    address_validated_at TIMESTAMP WITH TIME ZONE,
    validation_provider TEXT, -- usps, google, etc.
    
    -- Usage tracking
    usage_count INTEGER DEFAULT 0,
    last_used_at TIMESTAMP WITH TIME ZONE,
    
    -- User and system fields
    user_internal_id TEXT NOT NULL,
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Additional metadata
    address_notes TEXT,
    address_source TEXT, -- manual, import, api, etc.
    is_primary BOOLEAN DEFAULT FALSE,
    is_verified BOOLEAN DEFAULT FALSE,
    
    -- Indexes
    UNIQUE(address_datum, user_internal_id)
);

-- Add indexes for performance
CREATE INDEX IF NOT EXISTS idx_addresspren_user ON addresspren(user_internal_id);
CREATE INDEX IF NOT EXISTS idx_addresspren_city_state ON addresspren(city, state_code);
CREATE INDEX IF NOT EXISTS idx_addresspren_zip ON addresspren(zip_code);
CREATE INDEX IF NOT EXISTS idx_addresspren_geocoded ON addresspren(latitude, longitude);

-- =====================================================
-- 2. ADDRESSPREN_ORG_ENTITIES TABLE (like redditurlsvat_org_entities)
-- =====================================================
CREATE TABLE IF NOT EXISTS addresspren_org_entities (
    id SERIAL PRIMARY KEY,
    fk_addresspren_id INTEGER NOT NULL REFERENCES addresspren(address_id) ON DELETE CASCADE,
    user_id TEXT NOT NULL, -- User who assigned the entities
    
    -- Boolean organizational entities (matching established pattern)
    starred BOOLEAN DEFAULT FALSE,
    flagged BOOLEAN DEFAULT FALSE,
    circled BOOLEAN DEFAULT FALSE,
    squared BOOLEAN DEFAULT FALSE,
    triangled BOOLEAN DEFAULT FALSE,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure one org entity record per user per address
    UNIQUE(fk_addresspren_id, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_addresspren_org_entities_address ON addresspren_org_entities(fk_addresspren_id);
CREATE INDEX IF NOT EXISTS idx_addresspren_org_entities_user ON addresspren_org_entities(user_id);
CREATE INDEX IF NOT EXISTS idx_addresspren_org_entities_starred ON addresspren_org_entities(starred) WHERE starred = TRUE;
CREATE INDEX IF NOT EXISTS idx_addresspren_org_entities_flagged ON addresspren_org_entities(flagged) WHERE flagged = TRUE;

-- =====================================================
-- 3. ADDRESSPREN_TAGS TABLE (like keywordshub_tags, redditurlsvat_tags)
-- =====================================================
CREATE TABLE IF NOT EXISTS addresspren_tags (
    tag_id SERIAL PRIMARY KEY,
    tag_name TEXT NOT NULL,
    user_id TEXT NOT NULL, -- User who owns this tag
    tag_position INTEGER DEFAULT 0, -- For ordering tags
    tag_color TEXT, -- For UI customization
    tag_description TEXT,
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique tag names per user
    UNIQUE(tag_name, user_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_addresspren_tags_user ON addresspren_tags(user_id);
CREATE INDEX IF NOT EXISTS idx_addresspren_tags_position ON addresspren_tags(tag_position);

-- =====================================================
-- 4. ADDRESSPREN_TAGS_RELATIONS TABLE (like keywordshub_tag_relations)
-- =====================================================
CREATE TABLE IF NOT EXISTS addresspren_tags_relations (
    relation_id SERIAL PRIMARY KEY,
    fk_addresspren_id INTEGER NOT NULL REFERENCES addresspren(address_id) ON DELETE CASCADE,
    fk_tag_id INTEGER NOT NULL REFERENCES addresspren_tags(tag_id) ON DELETE CASCADE,
    tag_position INTEGER DEFAULT 0, -- Position of this tag on this address
    user_id TEXT NOT NULL, -- User who created this relation
    
    -- Timestamps
    created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
    
    -- Ensure unique tag assignment per address
    UNIQUE(fk_addresspren_id, fk_tag_id)
);

-- Add indexes
CREATE INDEX IF NOT EXISTS idx_addresspren_tag_relations_address ON addresspren_tags_relations(fk_addresspren_id);
CREATE INDEX IF NOT EXISTS idx_addresspren_tag_relations_tag ON addresspren_tags_relations(fk_tag_id);
CREATE INDEX IF NOT EXISTS idx_addresspren_tag_relations_user ON addresspren_tags_relations(user_id);

-- =====================================================
-- COMMENTS FOR DOCUMENTATION
-- =====================================================
COMMENT ON TABLE addresspren IS 'Main address storage table with geocoding and validation support';
COMMENT ON COLUMN addresspren.address_datum IS 'The primary address string as entered by user';
COMMENT ON COLUMN addresspren.user_internal_id IS 'Foreign key to users table user_internal_id field';

COMMENT ON TABLE addresspren_org_entities IS 'Boolean organizational entities for addresses (starred, flagged, etc.)';
COMMENT ON COLUMN addresspren_org_entities.user_id IS 'User who assigned these organizational entities';

COMMENT ON TABLE addresspren_tags IS 'User-defined tags for organizing addresses';
COMMENT ON TABLE addresspren_tags_relations IS 'Many-to-many relationship between addresses and tags';

-- =====================================================
-- EXAMPLE TRIGGERS (for updated_at timestamps)
-- =====================================================
-- Update timestamp triggers (optional, can be handled in application)
/*
CREATE OR REPLACE FUNCTION update_updated_at_column()
RETURNS TRIGGER AS $$
BEGIN
    NEW.updated_at = NOW();
    RETURN NEW;
END;
$$ language 'plpgsql';

CREATE TRIGGER update_addresspren_updated_at BEFORE UPDATE ON addresspren
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_addresspren_org_entities_updated_at BEFORE UPDATE ON addresspren_org_entities
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
    
CREATE TRIGGER update_addresspren_tags_updated_at BEFORE UPDATE ON addresspren_tags
    FOR EACH ROW EXECUTE FUNCTION update_updated_at_column();
*/