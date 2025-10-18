# Transform Function - User Flow

## Step-by-Step Visual Guide

### Step 1: Select an Item
- Open Selector Popup
- Use `select_x` to select a release/subsheet/subpart
- Transform button becomes enabled (purple)

### Step 2: Click "transform" Button
- Pre-transform check runs automatically
- Analyzes all rows in the selection

### Step 3: Review Confirmation Popup

#### Scenario A: First Time Transforming (No Duplicates)
```
🔄 Transform Data Confirmation

Review the transformation statistics before proceeding:

┌─────────────────────────────────────────────┐
│ Total rows in selection:        8,465      │
│ Already transformed:               0       │  (orange)
│ Not yet transformed:           8,465       │  (green)
└─────────────────────────────────────────────┘

What will happen:
• 8,465 rows will be grouped by city/state/payout/subpart
• Zip codes will be aggregated with "/" separator
• New records will be created in leadsmart_transformed
• Relations will be tracked in leadsmart_transformed_relations
• Source data in leadsmart_zip_based_data will NOT be modified

[Cancel]  [Yes, Transform Now]  ← ENABLED
```

#### Scenario B: Some Rows Already Transformed
```
🔄 Transform Data Confirmation

Review the transformation statistics before proceeding:

┌─────────────────────────────────────────────┐
│ Total rows in selection:        8,465      │
│ Already transformed:           3,200       │  (orange)
│ Not yet transformed:           5,265       │  (green)
└─────────────────────────────────────────────┘

⚠️ Warning: Some rows already transformed
   3,200 rows have already been transformed and will 
   be skipped to prevent duplicates.

What will happen:
• 5,265 rows will be grouped by city/state/payout/subpart
• Zip codes will be aggregated with "/" separator
• New records will be created in leadsmart_transformed
• Relations will be tracked in leadsmart_transformed_relations
• Source data in leadsmart_zip_based_data will NOT be modified

[Cancel]  [Yes, Transform Now]  ← ENABLED
```

#### Scenario C: All Rows Already Transformed
```
🔄 Transform Data Confirmation

Review the transformation statistics before proceeding:

┌─────────────────────────────────────────────┐
│ Total rows in selection:        8,465      │
│ Already transformed:           8,465       │  (orange)
│ Not yet transformed:               0       │  (green)
└─────────────────────────────────────────────┘

⚠️ No new rows to transform!
   All valid rows have already been transformed. 
   There is nothing new to process.

What will happen:
• 0 rows will be grouped by city/state/payout/subpart
• Zip codes will be aggregated with "/" separator
• New records will be created in leadsmart_transformed
• Relations will be tracked in leadsmart_transformed_relations
• Source data in leadsmart_zip_based_data will NOT be modified

[Cancel]  [No Rows to Transform]  ← DISABLED
```

#### Scenario D: Invalid Rows Detected
```
🔄 Transform Data Confirmation

Review the transformation statistics before proceeding:

┌─────────────────────────────────────────────┐
│ Total rows in selection:        8,465      │
│ Already transformed:               0       │  (orange)
│ Not yet transformed:           8,450       │  (green)
│ Invalid/header rows:              15       │  (red)
└─────────────────────────────────────────────┘

What will happen:
• 8,450 rows will be grouped by city/state/payout/subpart
• Zip codes will be aggregated with "/" separator
• New records will be created in leadsmart_transformed
• Relations will be tracked in leadsmart_transformed_relations
• Source data in leadsmart_zip_based_data will NOT be modified

[Cancel]  [Yes, Transform Now]  ← ENABLED
```

### Step 4: Transformation Processing
- Button shows "Transforming..."
- Backend groups data and creates records
- May take a few seconds for large datasets

### Step 5: Review Results Popup
```
Transform Results

┌─────────────────────────────────────────────────────┐
│ ✅ TRANSFORM COMPLETE!                              │
│                                                     │
│ Source Data Analysis:                               │
│ - 8,465 total rows from leadsmart_zip_based_data   │
│ - 0 rows already transformed (skipped)             │
│ - 8,465 rows not yet transformed                   │
│ - 15 rows skipped (invalid/missing data)           │
│ - 8,450 valid rows processed                       │
│                                                     │
│ Transformed Results:                                │
│ - 1,247 NEW records created in leadsmart_transf... │
│ - 0 existing records updated in leadsmart_trans... │
│ - 8,450 relation records created                   │
│ - 1,247 unique city/state/payout combinations      │
│                                                     │
│ Grouping Criteria:                                  │
│ - city_name, state_code, payout, jrel_subpart_id   │
│                                                     │
│ Selection:                                          │
│ - subsheet: #1                                      │
└─────────────────────────────────────────────────────┘

[📋 Copy to Clipboard]  [Close]
```

## Key Benefits

### 🛡️ Prevents Duplicates
- No row can be transformed twice
- System checks `leadsmart_transformed_relations` before transforming
- Clear warnings when duplicates are detected

### 📊 Transparent Process
- See exactly what will happen before it happens
- Know how many rows are already transformed
- Understand what will be processed

### 🚫 Impossible to Make Mistakes
- Button disabled when nothing to transform
- Can't accidentally re-transform data
- Clear error messages for all scenarios

### 🔄 Safe to Re-run
- If transform is interrupted, just run it again
- Only new rows will be processed
- Already-transformed rows automatically skipped

## Common Scenarios

### "I want to add more data and transform it"
1. Insert new rows into `leadsmart_zip_based_data`
2. Make sure they have the same `rel_release_id`/`rel_subsheet_id`/`rel_subpart_id`
3. Run transform again
4. Only the NEW rows will be transformed

### "I accidentally transformed the wrong data"
1. Use the "delete" function in Selector Popup
2. Check "delete associated rows from leadsmart_transformed and leadsmart_relations"
3. Confirm deletion
4. Transform again with correct selection

### "Some rows failed to transform"
1. Check the transform results for error details
2. Fix the source data if needed
3. Run transform again
4. Only failed rows will be retried (if they weren't already transformed)

