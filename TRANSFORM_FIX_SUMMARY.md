# Transform Function Error Fix Summary

**Run `TRANSFORM_SETUP_ALL_IN_ONE.sql` to fix all issues at once!**

## Issues Found

### 1. **Missing Database Column**
The `leadsmart_zip_based_data` table is missing the `rel_subsheet_id` column that the code expects.

**Error:**
```
jerylujyofmmjukwlwvn.supabase.co/rest/v1/leadsmart_zip_based_data?select=*&rel_subsheet_id=eq.1:1
Failed to load resource: the server responded with a status of 400 ()
```

**Solution:**
Run `add_rel_subsheet_id_to_zip_based_data.sql` to add the missing column.

### 2. **URL Length Limit Exceeded**
When querying with large datasets (10,000+ rows), the URL with all the IDs became too long and caused network errors.

**Error:**
```
jerylujyofmmjukwlwvn.supabase.co/rest/v1/leadsmart_transformed_relations?select=transformed_mundial_id&original_global_id=in.%281%2C2%2C3%2C...thousands of IDs...%29
Failed to load resource: net::ERR_FAILED
```

**Solution:**
Implemented batching with a batch size of 500 IDs per query to keep URLs short.

### 3. **Invalid Data in Source Table**
The source data appears to contain header rows or invalid data with literal values like "city", "state_id", etc.

**Error:**
```
city_name=eq.city&state_code=eq.state_id&payout=eq.null
```

**Solution:**
Added data validation to:
- Skip rows with missing city_name, state_code, or payout
- Skip rows that look like header rows (city="city", state="state_code", etc.)
- Report skipped rows in the transform results

## SQL Files to Run (IN ORDER)

### 1. **`add_rel_subsheet_id_to_zip_based_data.sql`** ⚠️ **RUN THIS FIRST**
Adds the missing `rel_subsheet_id` column to `leadsmart_zip_based_data`.

### 2. **`leadsmart_transformed_add_fk_columns.sql`**
Adds the three jrel_* columns to `leadsmart_transformed`.

### 3. **`leadsmart_transformed_add_unique_constraint.sql`**
Adds the unique constraint to prevent duplicate transformed records.

## Code Fixes Applied

### `SelectorPopup.tsx` Changes:

1. **Duplicate Prevention** - NEW FEATURE:
   - Pre-transform check identifies already-transformed rows
   - Confirmation popup shows statistics BEFORE transforming
   - Skips rows already in `leadsmart_transformed_relations`
   - Prevents accidental re-transformation
   - Shows warnings when duplicates detected

2. **Data Validation** - Added checks to skip:
   - Rows with null/missing city_name, state_code, or payout
   - Rows that appear to be headers

3. **Batching for URL Length** - Implemented batching (500 items per query) in:
   - `fetchTransformedDataCount()` useEffect
   - `fetchTransformedDataCount()` helper function
   - `handleDelete()` function when deleting associated data
   - `checkTransformStatus()` function for pre-transform check
   - `handleTransform()` function for actual transformation

4. **Better Reporting** - Transform confirmation and results now show:
   - Total rows from source
   - Rows already transformed (skipped)
   - Rows not yet transformed (will be processed)
   - Rows skipped due to invalid data
   - Valid rows processed
   - Unique combinations created

## How to Fix Your Error

**Run these SQL commands in Supabase SQL Editor (in order):**

```sql
-- 1. Add missing column to leadsmart_zip_based_data
ALTER TABLE leadsmart_zip_based_data
ADD COLUMN rel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;

CREATE INDEX idx_leadsmart_zip_based_data_rel_subsheet_id ON leadsmart_zip_based_data(rel_subsheet_id);

-- 2. Add jrel columns to leadsmart_transformed
ALTER TABLE leadsmart_transformed
ADD COLUMN jrel_release_id INTEGER REFERENCES leadsmart_file_releases(release_id) ON DELETE SET NULL;

ALTER TABLE leadsmart_transformed
ADD COLUMN jrel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;

ALTER TABLE leadsmart_transformed
ADD COLUMN jrel_subpart_id INTEGER REFERENCES leadsmart_subparts(subpart_id) ON DELETE SET NULL;

CREATE INDEX idx_leadsmart_transformed_jrel_release_id ON leadsmart_transformed(jrel_release_id);
CREATE INDEX idx_leadsmart_transformed_jrel_subsheet_id ON leadsmart_transformed(jrel_subsheet_id);
CREATE INDEX idx_leadsmart_transformed_jrel_subpart_id ON leadsmart_transformed(jrel_subpart_id);

-- 3. Add unique constraint
ALTER TABLE leadsmart_transformed
ADD CONSTRAINT leadsmart_transformed_unique_combination 
UNIQUE (city_name, state_code, payout, jrel_subpart_id);
```

## After Running SQL

1. **Refresh your browser** to clear any cached errors
2. **Try the transform function again**
3. The function will now:
   - Skip invalid rows automatically
   - Handle large datasets without URL errors
   - Provide detailed reporting of results

## Optional: Clean Up Invalid Data

If you want to remove the invalid header rows from your database:

```sql
-- Find potential header rows
SELECT * FROM leadsmart_zip_based_data 
WHERE city_name ILIKE 'city%' 
   OR state_code ILIKE 'state%'
   OR city_name IS NULL 
   OR state_code IS NULL 
   OR payout IS NULL;

-- Delete them (after verifying they're wrong)
DELETE FROM leadsmart_zip_based_data 
WHERE city_name ILIKE 'city%' 
   OR state_code ILIKE 'state%';
```

