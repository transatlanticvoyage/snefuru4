-- Add qty_starred and qty_chosen columns to keywordshub_tags table
ALTER TABLE keywordshub_tags 
ADD COLUMN qty_starred INTEGER DEFAULT 0,
ADD COLUMN qty_chosen INTEGER DEFAULT 0;

-- Add comments to document the columns
COMMENT ON COLUMN keywordshub_tags.qty_starred IS 'Cached count of starred keywords belonging to this tag';
COMMENT ON COLUMN keywordshub_tags.qty_chosen IS 'Cached count of chosen keywords belonging to this tag';

-- Create index for better performance when querying by these columns (optional)
CREATE INDEX idx_keywordshub_tags_qty_starred ON keywordshub_tags(qty_starred);
CREATE INDEX idx_keywordshub_tags_qty_chosen ON keywordshub_tags(qty_chosen);