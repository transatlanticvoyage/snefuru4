-- Add is_starred column to keywordshub_tag_groups table
ALTER TABLE keywordshub_tag_groups 
ADD COLUMN is_starred BOOLEAN DEFAULT FALSE;

-- Add comment to document the column
COMMENT ON COLUMN keywordshub_tag_groups.is_starred IS 'Indicates if the group is starred/favorited by the user';