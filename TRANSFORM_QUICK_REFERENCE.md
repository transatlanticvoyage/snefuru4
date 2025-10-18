# Transform Function - Quick Reference

## 🚀 Quick Start

1. **Run SQL:** `TRANSFORM_SETUP_ALL_IN_ONE.sql`
2. **Refresh browser**
3. **Open Selector Popup** → select item → click "transform"
4. **Review confirmation** → click "Yes, Transform Now"
5. **Done!**

## ✅ What It Does

**Transforms this:**
```
zip_code | payout | city_name | state_code
85001    | 43.50  | Phoenix   | AZ
85002    | 43.50  | Phoenix   | AZ
85003    | 75.00  | Phoenix   | AZ
```

**Into this:**
```
mundial_id | city_name | state_code | payout | aggregated_zip_codes
1          | phoenix   | az         | 43.50  | 85001/85002
2          | phoenix   | az         | 75.00  | 85003
```

## 🛡️ Safety Features

| Feature | What It Does |
|---------|-------------|
| **Duplicate Prevention** | Checks if rows already transformed, skips them |
| **Pre-transform Confirmation** | Shows stats BEFORE transforming |
| **Data Validation** | Skips invalid/header rows automatically |
| **Batch Processing** | Handles large datasets without errors |
| **Non-Destructive** | Never modifies source data |

## 📊 Confirmation Popup Stats

| Stat | Color | Meaning |
|------|-------|---------|
| Total rows | Gray | All rows in your selection |
| Already transformed | Orange | Will be skipped (duplicate prevention) |
| Not yet transformed | Green | Will be processed |
| Invalid rows | Red | Will be skipped (bad data) |

## ⚠️ Warnings

### Yellow Warning
**"Some rows already transformed"**
- Some rows in your selection have already been transformed
- Only new rows will be processed
- This is NORMAL if you're adding more data

### Red Error
**"No new rows to transform!"**
- ALL rows have already been transformed
- Nothing to do
- "Transform Now" button is disabled

## 🔧 Troubleshooting

### Error: "Failed to load resource: 400"
**Cause:** Missing `rel_subsheet_id` column
**Fix:** Run `TRANSFORM_SETUP_ALL_IN_ONE.sql`

### Error: "net::ERR_FAILED" (URL too long)
**Cause:** Too many rows causing URL length limit
**Fix:** Already fixed in code with batch processing

### Error: "city_name=eq.city"
**Cause:** Header rows in database
**Fix:** Automatically skipped by code, or run `CLEANUP_INVALID_DATA.sql`

### Transform button disabled
**Cause:** No item selected via `select_x`
**Fix:** Click `select_x` on a release/subsheet/subpart first

### "No new rows to transform"
**Cause:** All rows already transformed
**Fix:** This is normal! Add new data if you need to transform more

## 📋 SQL Files

| File | Purpose | When to Run |
|------|---------|-------------|
| `TRANSFORM_SETUP_ALL_IN_ONE.sql` | Complete setup | Run once (required) |
| `add_rel_subsheet_id_to_zip_based_data.sql` | Add missing column | Included in ALL_IN_ONE |
| `leadsmart_transformed_add_fk_columns.sql` | Add jrel_* columns | Included in ALL_IN_ONE |
| `leadsmart_transformed_add_unique_constraint.sql` | Add unique constraint | Included in ALL_IN_ONE |
| `CLEANUP_INVALID_DATA.sql` | Remove bad data | Optional |

## 🎯 Best Practices

1. **Always review confirmation popup** before transforming
2. **Check "Already transformed" count** to avoid surprises
3. **Run cleanup SQL** if you have many invalid rows
4. **Use delete function** to undo transformations if needed
5. **Transform incrementally** as you add new data

## 💡 Tips

- You can safely click transform multiple times - duplicates are prevented
- If interrupted, just run again - progress is saved
- Delete function also deletes associated transformed data (with checkbox option)
- Transformation is fast even with 10,000+ rows

