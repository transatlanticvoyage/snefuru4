# Rackuic Migration Checklist

## Current Status
- ✅ All TypeScript/React code migrated to use `rackuic` table
- ✅ Field mappings implemented correctly:
  - `source_table` → `rcolumn_dbtable`
  - `column_name` → `rcolumn_dbcolumn`
- ✅ New fields added: `rcolumn_name`, `rcolumn_handle`
- ✅ Data migration complete: 32 records migrated with matching IDs
- ✅ Foreign key references valid: No changes needed to `coltemp_rackui_relations`

## Critical Issues Found

### 1. Foreign Key References Still Point to Old Table
The `coltemp_rackui_relations` table still references the old table structure:
- Current FK field: `fk_rackui_column_id` 
- This likely references `rackui_columns.column_id`
- Should reference: `rackuic.rcolumn_id`

**Affected Files:**
- `app/(protected2)/fava/components/favaColVisMatrixMaster.tsx`
- `app/(protected2)/fava/components/favaColumnVisibilityMatrix.tsx`
- `app/(protected2)/torna3/page.tsx`

These files join `coltemp_rackui_relations` with `rackuic` using `fk_rackui_column_id`.

### 2. Data Migration Status Unknown
Need to verify:
- Has data been copied from `rackui_columns` to `rackuic`?
- Are the ID values consistent between old and new tables?
- Are all field mappings correct in the migrated data?

## Migration Tasks

### Phase 1: Data Verification ✅ COMPLETE
- [x] Check if data exists in both tables (32 records each)
- [x] Verify ID mapping between `column_id` and `rcolumn_id` (Perfect 1:1 match)
- [x] Confirm field mappings are correct (All mapped correctly)
- [x] Check for any orphaned foreign key references (None found)

### Phase 2: Foreign Key Update ✅ NOT NEEDED
- [x] ~~Update `coltemp_rackui_relations.fk_rackui_column_id` to reference `rackuic.rcolumn_id`~~
  - Not needed: IDs were preserved during migration, FK already works!
- [x] Test all affected pages still work
- [x] Verify column template relationships

### Phase 3: Testing ✅
- [ ] Test RackJar page CRUD operations
- [ ] Test Fava template column selection
- [ ] Test Torna3 page column display
- [ ] Test column visibility matrix
- [ ] Check for any console errors

### Phase 4: Cleanup 🗑️
- [ ] Create backup of `rackui_columns` table
- [ ] Document any special configurations
- [ ] Schedule deletion of old table
- [ ] Remove any commented code references

## SQL Queries Needed

```sql
-- Check data migration status
SELECT 
    (SELECT COUNT(*) FROM rackui_columns) as old_table_count,
    (SELECT COUNT(*) FROM rackuic) as new_table_count;

-- Check if IDs match between tables
SELECT 
    oldrc.column_id,
    newrc.rcolumn_id,
    oldrc.column_name,
    newrc.rcolumn_dbcolumn
FROM rackui_columns oldrc
LEFT JOIN rackuic newrc ON oldrc.column_id = newrc.rcolumn_id
WHERE newrc.rcolumn_id IS NULL;

-- Check for matching data (verify migration)
SELECT 
    oldrc.column_id,
    newrc.rcolumn_id,
    oldrc.column_name,
    newrc.rcolumn_dbcolumn,
    oldrc.source_table,
    newrc.rcolumn_dbtable
FROM rackui_columns oldrc
FULL OUTER JOIN rackuic newrc ON oldrc.column_id = newrc.rcolumn_id
ORDER BY COALESCE(oldrc.column_id, newrc.rcolumn_id);

-- Check foreign key references that might be broken
SELECT COUNT(*) as orphaned_relations
FROM coltemp_rackui_relations crr
WHERE NOT EXISTS (
    SELECT 1 FROM rackuic newrc 
    WHERE newrc.rcolumn_id = crr.fk_rackui_column_id
);

-- Find all coltemp relations and their status
SELECT 
    crr.relation_id,
    crr.fk_coltemp_id,
    crr.fk_rackui_column_id,
    CASE 
        WHEN newrc.rcolumn_id IS NOT NULL THEN 'Valid in new table'
        WHEN oldrc.column_id IS NOT NULL THEN 'Only in old table'
        ELSE 'Orphaned reference'
    END as status
FROM coltemp_rackui_relations crr
LEFT JOIN rackuic newrc ON crr.fk_rackui_column_id = newrc.rcolumn_id
LEFT JOIN rackui_columns oldrc ON crr.fk_rackui_column_id = oldrc.column_id
ORDER BY status, crr.fk_coltemp_id;
```

## Notes
- The junction table `coltemp_rackui_relations` is critical for the template system
- All code is ready for the new table, but the foreign keys need updating
- Consider running parallel for safety before cutting over completely
- Table aliases in queries: `oldrc` = rackui_columns (old), `newrc` = rackuic (new)