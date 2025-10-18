-- =====================================================
-- Create leadsmart_transformed table
-- =====================================================
CREATE TABLE leadsmart_transformed (
  mundial_id SERIAL PRIMARY KEY,
  city_name TEXT,
  state_code VARCHAR(2),
  payout NUMERIC(10, 2),
  aggregated_zip_codes TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for leadsmart_transformed
CREATE INDEX idx_leadsmart_transformed_city_name ON leadsmart_transformed(city_name);
CREATE INDEX idx_leadsmart_transformed_state_code ON leadsmart_transformed(state_code);

-- Create trigger function for leadsmart_transformed updated_at
CREATE OR REPLACE FUNCTION update_leadsmart_transformed_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leadsmart_transformed
CREATE TRIGGER set_leadsmart_transformed_updated_at
  BEFORE UPDATE ON leadsmart_transformed
  FOR EACH ROW
  EXECUTE FUNCTION update_leadsmart_transformed_updated_at();


-- =====================================================
-- Create leadsmart_zip_based_to_transformed_relations table
-- =====================================================
CREATE TABLE leadsmart_zip_based_to_transformed_relations (
  relation_id SERIAL PRIMARY KEY,
  original_global_id INTEGER REFERENCES leadsmart_zip_based_data(global_row_id) ON DELETE CASCADE,
  transformed_mundial_id INTEGER REFERENCES leadsmart_transformed(mundial_id) ON DELETE CASCADE,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW()
);

-- Create indexes for leadsmart_zip_based_to_transformed_relations
CREATE INDEX idx_leadsmart_relations_original_global_id ON leadsmart_zip_based_to_transformed_relations(original_global_id);
CREATE INDEX idx_leadsmart_relations_transformed_mundial_id ON leadsmart_zip_based_to_transformed_relations(transformed_mundial_id);

-- Create trigger function for leadsmart_zip_based_to_transformed_relations updated_at
CREATE OR REPLACE FUNCTION update_leadsmart_relations_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leadsmart_zip_based_to_transformed_relations
CREATE TRIGGER set_leadsmart_relations_updated_at
  BEFORE UPDATE ON leadsmart_zip_based_to_transformed_relations
  FOR EACH ROW
  EXECUTE FUNCTION update_leadsmart_relations_updated_at();


-- =====================================================
-- Create leadsmart_subsheets table
-- =====================================================
CREATE TABLE leadsmart_subsheets (
  subsheet_id SERIAL PRIMARY KEY,
  rel_original_global_row_id INTEGER REFERENCES leadsmart_zip_based_data(global_row_id) ON DELETE SET NULL,
  rel_transformed_mundial_id INTEGER REFERENCES leadsmart_transformed(mundial_id) ON DELETE SET NULL,
  subsheet_name TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for leadsmart_subsheets
CREATE INDEX idx_leadsmart_subsheets_original_global_row_id ON leadsmart_subsheets(rel_original_global_row_id);
CREATE INDEX idx_leadsmart_subsheets_transformed_mundial_id ON leadsmart_subsheets(rel_transformed_mundial_id);
CREATE INDEX idx_leadsmart_subsheets_created_by ON leadsmart_subsheets(created_by);

-- Create trigger function for leadsmart_subsheets updated_at
CREATE OR REPLACE FUNCTION update_leadsmart_subsheets_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leadsmart_subsheets
CREATE TRIGGER set_leadsmart_subsheets_updated_at
  BEFORE UPDATE ON leadsmart_subsheets
  FOR EACH ROW
  EXECUTE FUNCTION update_leadsmart_subsheets_updated_at();


-- =====================================================
-- Create leadsmart_subparts table
-- =====================================================
CREATE TABLE leadsmart_subparts (
  subpart_id SERIAL PRIMARY KEY,
  rel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE CASCADE,
  subpart_name TEXT,
  payout_note TEXT,
  created_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  updated_at TIMESTAMP WITH TIME ZONE DEFAULT NOW(),
  created_by UUID REFERENCES auth.users(id) ON DELETE SET NULL
);

-- Create indexes for leadsmart_subparts
CREATE INDEX idx_leadsmart_subparts_subsheet_id ON leadsmart_subparts(rel_subsheet_id);
CREATE INDEX idx_leadsmart_subparts_created_by ON leadsmart_subparts(created_by);

-- Create trigger function for leadsmart_subparts updated_at
CREATE OR REPLACE FUNCTION update_leadsmart_subparts_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = NOW();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Create trigger for leadsmart_subparts
CREATE TRIGGER set_leadsmart_subparts_updated_at
  BEFORE UPDATE ON leadsmart_subparts
  FOR EACH ROW
  EXECUTE FUNCTION update_leadsmart_subparts_updated_at();

