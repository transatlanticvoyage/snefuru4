# Leadsmart Transform Function Implementation

## Overview
The transform function aggregates data from `leadsmart_zip_based_data` into condensed records in `leadsmart_transformed`, grouping by city, state, payout, and subpart.

## SQL Files to Run (in order)

### 1. `leadsmart_transformed_add_fk_columns.sql`
**Run this FIRST**

Adds three foreign key columns to `leadsmart_transformed`:
- `jrel_release_id` → FK to `leadsmart_file_releases.release_id`
- `jrel_subsheet_id` → FK to `leadsmart_subsheets.subsheet_id`
- `jrel_subpart_id` → FK to `leadsmart_subparts.subpart_id`

Also creates indexes on these columns for performance.

### 2. `leadsmart_transformed_add_unique_constraint.sql`
**Run this SECOND (after foreign key columns exist)**

Adds a unique constraint on the combination:
- `city_name`
- `state_code`
- `payout`
- `jrel_subpart_id`

This ensures no duplicate transformed records with the same city/state/payout/subpart combination.

## Transform Process

### How It Works

1. **User selects an item** (release/subsheet/subpart) via `select_x` in the Selector Popup
2. **User clicks "transform" button**
3. **Pre-transform check:**
   - Fetches all rows for the selection
   - Identifies which rows are already transformed
   - Identifies invalid/header rows
   - Shows confirmation popup with statistics
4. **User confirms transformation**
5. **Backend process:**
   - Fetches all `leadsmart_zip_based_data` rows matching the selection
   - Groups rows by:
     - `city_name` (lowercase, trimmed)
     - `state_code` (lowercase, trimmed)
     - `payout`
     - `rel_release_id`
     - `rel_subsheet_id`
     - `rel_subpart_id`
   - For each group:
     - Aggregates zip codes (sorted, slash-separated)
     - Checks if a matching `leadsmart_transformed` record exists (via unique constraint)
     - **If exists:** Updates the `aggregated_zip_codes` and jrel_* values
     - **If not exists:** Inserts a new record
     - Creates relation records in `leadsmart_transformed_relations` linking each source row to the transformed row

### Example Transformation

**Source Data (`leadsmart_zip_based_data`):**
```
zip_code | payout | city_name    | state_code | rel_release_id | rel_subsheet_id | rel_subpart_id
---------|--------|--------------|------------|----------------|-----------------|---------------
85001    | 43.50  | Saint George | UT         | 1              | 1               | 1
85002    | 43.50  | Saint George | UT         | 1              | 1               | 1
85003    | 43.50  | Phoenix      | AZ         | 1              | 1               | 1
85004    | 43.50  | Phoenix      | AZ         | 1              | 1               | 1
85013    | 75.00  | Phoenix      | AZ         | 1              | 1               | 1
```

**Transformed Data (`leadsmart_transformed`):**
```
mundial_id | city_name    | state_code | payout | aggregated_zip_codes | jrel_release_id | jrel_subsheet_id | jrel_subpart_id
-----------|--------------|------------|--------|----------------------|-----------------|------------------|----------------
1          | saint george | ut         | 43.50  | 85001/85002          | 1               | 1                | 1
2          | phoenix      | az         | 43.50  | 85003/85004          | 1               | 1                | 1
3          | phoenix      | az         | 75.00  | 85013                | 1               | 1                | 1
```

**Relations (`leadsmart_transformed_relations`):**
```
relation_id | original_global_id | transformed_mundial_id
------------|--------------------|-----------------------
1           | 101                | 1
2           | 102                | 1
3           | 103                | 2
4           | 104                | 2
5           | 105                | 3
```

## Key Features

### ✅ Non-Destructive
- Source data in `leadsmart_zip_based_data` is **never modified**
- Only creates/updates records in `leadsmart_transformed`

### ✅ Duplicate Prevention
- **Pre-transform check** identifies already-transformed rows
- Skips rows that are already in `leadsmart_transformed_relations`
- **Confirmation popup** shows statistics BEFORE transforming:
  - Total rows in selection
  - Rows already transformed (will be skipped)
  - Rows not yet transformed (will be processed)
  - Invalid/header rows (will be skipped)
- Yellow warning if some rows are already transformed
- Red warning if ALL rows are already transformed
- Disables "Transform Now" button if no new rows to process

### ✅ Idempotent
- Can run transform multiple times safely
- Existing transformed records are updated (zip codes re-aggregated)
- Unique constraint prevents duplicates
- Already-transformed source rows are never re-transformed

### ✅ Relationship Tracking
- One-to-many relationship: one transformed record → many source records
- Tracked via `leadsmart_transformed_relations`
- Each source row can only be transformed once

### ✅ User Feedback
- **Pre-transform confirmation** with detailed statistics
- **Post-transform results popup** with:
  - Number of source rows processed
  - Number of rows already transformed (skipped)
  - Number of rows not yet transformed
  - Number of invalid rows skipped
  - Number of new records created
  - Number of existing records updated
  - Number of relation records created
  - Copy to clipboard button

### ✅ Error Handling
- Comprehensive error messages
- Transaction safety
- Validates data before processing
- Batch processing for large datasets

## UI Components Updated

### `SelectorPopup.tsx`
- **Transform button** now enabled when item is selected
- **Pre-transform check** runs when button clicked
- **Transform Confirmation popup** shows BEFORE transforming:
  - Total rows in selection
  - Already transformed count (orange)
  - Not yet transformed count (green)
  - Invalid rows count (red) if any
  - Yellow warning if some rows already transformed
  - Red error if all rows already transformed
  - Disabled "Transform Now" button if no new rows
- Shows "Transforming..." state during processing
- **Transform Results popup** displays detailed results AFTER completion
- Automatically refreshes transformed data count after completion

## Database Schema

### `leadsmart_transformed`
```sql
mundial_id              SERIAL PRIMARY KEY
city_name               TEXT
state_code              TEXT
payout                  NUMERIC
aggregated_zip_codes    TEXT
jrel_release_id         INTEGER REFERENCES leadsmart_file_releases(release_id) ON DELETE SET NULL
jrel_subsheet_id        INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL
jrel_subpart_id         INTEGER REFERENCES leadsmart_subparts(subpart_id) ON DELETE SET NULL
created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()

UNIQUE CONSTRAINT: (city_name, state_code, payout, jrel_subpart_id)
```

### `leadsmart_transformed_relations`
```sql
relation_id             SERIAL PRIMARY KEY
original_global_id      INTEGER REFERENCES leadsmart_zip_based_data(global_row_id) ON DELETE CASCADE
transformed_mundial_id  INTEGER REFERENCES leadsmart_transformed(mundial_id) ON DELETE CASCADE
created_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
updated_at              TIMESTAMP WITH TIME ZONE DEFAULT NOW()
```

## Testing Steps

### Initial Transform Test
1. **Run SQL files in order** (FK columns → unique constraint)
2. **Open Selector Popup** on `/leadsmart_tank`
3. **Select a release/subsheet/subpart** via select_x
4. **Click "transform" button**
5. **Review pre-transform confirmation popup:**
   - Should show counts of total/already/not-yet transformed rows
   - Should NOT show warning if first time transforming
   - "Transform Now" button should be enabled
6. **Click "Yes, Transform Now"**
7. **Review results popup** with detailed statistics
8. **Verify data** in Supabase:
   - Check `leadsmart_transformed` for new records
   - Check `leadsmart_transformed_relations` for relation records
   - Verify aggregated zip codes are correct
   - Verify jrel_* values match source rel_* values

### Duplicate Prevention Test
1. **Select the SAME item** (same release/subsheet/subpart)
2. **Click "transform" button again**
3. **Review pre-transform confirmation popup:**
   - Should show "Already transformed" count matching previous transform
   - Should show yellow warning about already-transformed rows
   - Should show 0 "Not yet transformed" if all were transformed
   - Should show red error "No new rows to transform!"
   - "Transform Now" button should be DISABLED
4. **Verify** no duplicate relations are created in database

### Partial Re-transform Test
1. **Add NEW rows** to `leadsmart_zip_based_data` for the same release/subsheet/subpart
2. **Click "transform" button**
3. **Review confirmation popup:**
   - Should show OLD rows as "Already transformed"
   - Should show NEW rows as "Not yet transformed"
   - Yellow warning should appear
   - "Transform Now" button should be enabled
4. **Click "Yes, Transform Now"**
5. **Verify** only new rows were processed, old rows skipped

## Notes

- City names and state codes are **normalized to lowercase** for consistency
- Zip codes are **sorted alphabetically** before aggregation
- The **unique constraint** prevents duplicate city/state/payout/subpart combinations
- **ON DELETE SET NULL** on FK columns means deleting a release/subsheet/subpart won't delete transformed records (just sets FK to NULL)

