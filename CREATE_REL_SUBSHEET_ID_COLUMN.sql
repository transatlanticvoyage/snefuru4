-- =====================================================
-- CREATE rel_subsheet_id COLUMN IN leadsmart_zip_based_data
-- COPY THIS ENTIRE FILE AND RUN IN SUPABASE SQL EDITOR
-- =====================================================

ALTER TABLE leadsmart_zip_based_data
ADD COLUMN rel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;

CREATE INDEX idx_leadsmart_zip_based_data_rel_subsheet_id ON leadsmart_zip_based_data(rel_subsheet_id);

-- =====================================================
-- DONE! Verify it worked by running this:
-- =====================================================
-- SELECT column_name, data_type 
-- FROM information_schema.columns 
-- WHERE table_name = 'leadsmart_zip_based_data' 
-- AND column_name = 'rel_subsheet_id';

