-- Add fk_city_id foreign key column to leadsmart_transformed table
-- This creates a foreign key reference to cities.city_id

-- Step 1: Add the column as nullable initially
ALTER TABLE leadsmart_transformed 
ADD COLUMN fk_city_id INTEGER;

-- Step 2: Add the foreign key constraint
ALTER TABLE leadsmart_transformed 
ADD CONSTRAINT fk_leadsmart_transformed_city_id 
FOREIGN KEY (fk_city_id) REFERENCES cities(city_id);

-- Step 3: Create an index on the foreign key for better performance
CREATE INDEX idx_leadsmart_transformed_fk_city_id ON leadsmart_transformed(fk_city_id);

-- Verify the column was added successfully
SELECT column_name, data_type, is_nullable, column_default
FROM information_schema.columns 
WHERE table_name = 'leadsmart_transformed' 
  AND column_name = 'fk_city_id';