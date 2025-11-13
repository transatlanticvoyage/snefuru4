-- SQL to add new kwtuber columns to leadsmart_transformed table
-- Run this in Supabase SQL editor

-- Add volume_kwtuber1 column (integer for search volume)
ALTER TABLE leadsmart_transformed
ADD COLUMN IF NOT EXISTS volume_kwtuber1 INTEGER;

-- Add cpc_kwtuber1 column (decimal for cost per click)
ALTER TABLE leadsmart_transformed
ADD COLUMN IF NOT EXISTS cpc_kwtuber1 DECIMAL(10, 2);

-- Add yelp_kwtuber1 column (integer for yelp count/score)
ALTER TABLE leadsmart_transformed
ADD COLUMN IF NOT EXISTS yelp_kwtuber1 INTEGER;

-- Add volume_kwtuber2 column (integer for search volume)
ALTER TABLE leadsmart_transformed
ADD COLUMN IF NOT EXISTS volume_kwtuber2 INTEGER;

-- Add cpc_kwtuber2 column (decimal for cost per click)
ALTER TABLE leadsmart_transformed
ADD COLUMN IF NOT EXISTS cpc_kwtuber2 DECIMAL(10, 2);

-- Add yelp_kwtuber2 column (integer for yelp count/score)
ALTER TABLE leadsmart_transformed
ADD COLUMN IF NOT EXISTS yelp_kwtuber2 INTEGER;

-- Optional: Add comments to describe the columns
COMMENT ON COLUMN leadsmart_transformed.volume_kwtuber1 IS 'Search volume for kw-tuber-1 (with state)';
COMMENT ON COLUMN leadsmart_transformed.cpc_kwtuber1 IS 'Cost per click for kw-tuber-1 (with state)';
COMMENT ON COLUMN leadsmart_transformed.yelp_kwtuber1 IS 'Yelp metric for kw-tuber-1 (with state)';
COMMENT ON COLUMN leadsmart_transformed.volume_kwtuber2 IS 'Search volume for kw-tuber-2 (without state)';
COMMENT ON COLUMN leadsmart_transformed.cpc_kwtuber2 IS 'Cost per click for kw-tuber-2 (without state)';
COMMENT ON COLUMN leadsmart_transformed.yelp_kwtuber2 IS 'Yelp metric for kw-tuber-2 (without state)';

-- Verify the columns were added successfully
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'leadsmart_transformed' 
-- AND column_name LIKE '%kwtuber%'
-- ORDER BY column_name;