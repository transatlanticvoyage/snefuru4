-- PHASE 1: DATA VERIFICATION QUERIES
-- Run these queries to verify the migration status

-- 1. Check data migration status
SELECT 
    (SELECT COUNT(*) FROM rackui_columns) as old_table_count,
    (SELECT COUNT(*) FROM rackuic) as new_table_count;

-- 2. Check if IDs match between tables (find missing records in new table)
SELECT 
    oldrc.column_id,
    newrc.rcolumn_id,
    oldrc.column_name,
    newrc.rcolumn_dbcolumn,
    oldrc.source_table,
    newrc.rcolumn_dbtable
FROM rackui_columns oldrc
LEFT JOIN rackuic newrc ON oldrc.column_id = newrc.rcolumn_id
WHERE newrc.rcolumn_id IS NULL;

-- 3. Check for matching data (verify migration completeness)
SELECT 
    oldrc.column_id,
    newrc.rcolumn_id,
    oldrc.column_name,
    newrc.rcolumn_dbcolumn,
    oldrc.source_table,
    newrc.rcolumn_dbtable,
    CASE 
        WHEN oldrc.column_id IS NULL THEN 'NEW RECORD (not in old table)'
        WHEN newrc.rcolumn_id IS NULL THEN 'MISSING (not migrated to new table)'
        ELSE 'MIGRATED'
    END as migration_status
FROM rackui_columns oldrc
FULL OUTER JOIN rackuic newrc ON oldrc.column_id = newrc.rcolumn_id
ORDER BY COALESCE(oldrc.column_id, newrc.rcolumn_id);

-- 4. Check foreign key references that might be broken
SELECT COUNT(*) as orphaned_relations
FROM coltemp_rackui_relations crr
WHERE NOT EXISTS (
    SELECT 1 FROM rackuic newrc 
    WHERE newrc.rcolumn_id = crr.fk_rackui_column_id
);

-- 5. Find all coltemp relations and their status
SELECT 
    crr.relation_id,
    crr.fk_coltemp_id,
    crr.fk_rackui_column_id,
    ct.coltemp_name,
    CASE 
        WHEN newrc.rcolumn_id IS NOT NULL THEN 'Valid in new table'
        WHEN oldrc.column_id IS NOT NULL THEN 'Only in old table'
        ELSE 'Orphaned reference'
    END as status,
    oldrc.column_name as old_column_name,
    newrc.rcolumn_dbcolumn as new_column_name
FROM coltemp_rackui_relations crr
LEFT JOIN rackuic newrc ON crr.fk_rackui_column_id = newrc.rcolumn_id
LEFT JOIN rackui_columns oldrc ON crr.fk_rackui_column_id = oldrc.column_id
LEFT JOIN coltemps ct ON crr.fk_coltemp_id = ct.coltemp_id
ORDER BY status, crr.fk_coltemp_id
LIMIT 20;

-- 6. Compare field mappings to ensure correct migration
SELECT 
    oldrc.column_id,
    newrc.rcolumn_id,
    oldrc.column_name,
    newrc.rcolumn_dbcolumn,
    CASE WHEN oldrc.column_name = newrc.rcolumn_dbcolumn THEN 'MATCH' ELSE 'MISMATCH' END as name_check,
    oldrc.source_table,
    newrc.rcolumn_dbtable,
    CASE WHEN oldrc.source_table = newrc.rcolumn_dbtable THEN 'MATCH' ELSE 'MISMATCH' END as table_check
FROM rackui_columns oldrc
INNER JOIN rackuic newrc ON oldrc.column_id = newrc.rcolumn_id
WHERE oldrc.column_name != newrc.rcolumn_dbcolumn 
   OR oldrc.source_table != newrc.rcolumn_dbtable
LIMIT 20;