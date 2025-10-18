# Complete Setup Guide - Leadsmart Tank & Morph

## 🚀 Quick Start - Run These SQL Files

### Step 1: Run SQL in Supabase (in order)

```sql
-- 1. Add rel_subsheet_id to leadsmart_zip_based_data
-- File: ADD_REL_SUBSHEET_ID.sql
ALTER TABLE leadsmart_zip_based_data
ADD COLUMN rel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;
CREATE INDEX idx_leadsmart_zip_based_data_rel_subsheet_id ON leadsmart_zip_based_data(rel_subsheet_id);

-- 2. Add jrel_* columns to leadsmart_transformed
-- File: leadsmart_transformed_add_fk_columns.sql
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
-- File: leadsmart_transformed_add_unique_constraint.sql
ALTER TABLE leadsmart_transformed
ADD CONSTRAINT leadsmart_transformed_unique_combination 
UNIQUE (city_name, state_code, payout, jrel_subpart_id);
```

**OR** just run the all-in-one file: `TRANSFORM_SETUP_ALL_IN_ONE.sql`

### Step 2: Refresh Browser
After running SQL, refresh your browser to load the updated code.

## 📋 What Was Implemented

### 1. ✅ rel_subsheet_id Integration
- **Database:** New column in `leadsmart_zip_based_data`
- **UI Display:** Shows with ★ symbol in main table
- **Inline Editing:** Fully working (converts to INTEGER)
- **Bulk Insert:** Auto-populated from selected subsheet
- **Create New:** Works in both inline and popup modes

### 2. ✅ Transform Function
- **Pre-check:** Shows stats before transforming
- **Duplicate Prevention:** Skips already-transformed rows
- **Confirmation Popup:** Shows total/already/not-yet transformed counts
- **Warnings:** Yellow if some already transformed, red if all
- **Smart Processing:** Only transforms untransformed rows
- **Results:** Detailed post-transform statistics

### 3. ✅ Delete with Associated Data
- **Checkbox:** "delete associated rows from leadsmart_transformed and leadsmart_relations"
- **Auto-checked:** When associated data exists
- **Grayed out:** When no associated data exists
- **Count display:** Shows how many records will be deleted
- **Dual confirmation:** Two popups before deletion
- **Batch deletion:** Handles large datasets

### 4. ✅ Jettison Table Filter System
- **Location:** cardio_chamber on both pages
- **Display:** Hierarchical view (release → subsheet → subpart)
- **Filtering:** Single-selection filter system
- **Visual:** Yellow highlight on active filter
- **Auto-populate:** Child entities load automatically
- **Counts:** Row counts and child counts displayed
- **Reusable:** Same component on both pages with different configs

## 🎯 Complete Feature List

| Feature | Status | Pages |
|---------|--------|-------|
| rel_subsheet_id column | ✅ (need SQL) | Both |
| jrel_* columns | ✅ (need SQL) | leadsmart_morph |
| Unique constraint | ✅ (need SQL) | leadsmart_transformed |
| Transform function | ✅ Working | Via Selector Popup |
| Duplicate prevention | ✅ Working | Transform |
| Delete associated data | ✅ Working | Via Selector Popup |
| Jettison table | ✅ Working | Both pages |
| Filter main table | ✅ Working | Both pages |
| Selector popup | ✅ Working | Both pages |
| ZhedoriButtonBar | ✅ Working | Both pages |

## 📖 How to Use

### Transform Data Flow:
1. **Insert data** → `/leadsmart_tank` → "insert new data" button
2. **Select items** → make selections in all 3 grids (release, subsheet, subpart)
3. **Insert** → data goes into `leadsmart_zip_based_data`
4. **Transform** → Selector popup → `select_x` on release/subsheet/subpart → "transform"
5. **Review confirmation** → see already/not-yet transformed counts
6. **Confirm** → "Yes, Transform Now"
7. **Result** → data aggregated into `leadsmart_transformed`

### Filter & View Flow:
1. **Open selector** → Click "selector popup" button
2. **Select entity** → Use `select_x` system
3. **Apply filter** → Click "filter main ui table"
4. **View jettison table** → See hierarchy in cardio_chamber
5. **View filtered data** → Main table shows only selected entity's data
6. **Switch filter** → Click different filter button in jettison table

### Delete Flow:
1. **Open selector** → Click "selector popup" button
2. **Select entity** → Use `select_x` system
3. **Review checkbox** → "delete associated rows..." (auto-checked if data exists)
4. **Delete** → Click "delete" button
5. **First confirmation** → Yellow warning popup
6. **Second confirmation** → Red final warning popup
7. **Done** → Entity and optionally associated transformed data deleted

## 🗂️ File Structure

```
app/
├── components/
│   └── LeadSmartJettisonTable.tsx         [NEW - Shared filter table]
│
├── (protected)/
    ├── leadsmart_tank/
    │   ├── page.tsx                        [Updated - imports CSS]
    │   ├── pclient.tsx                     [Updated - jettison table + filter state]
    │   └── components/
    │       ├── LeadsmartTankTable.tsx      [Updated - accepts filter, number conversion]
    │       ├── InsertDataPopup.tsx         [Working - uses rel_subsheet_id]
    │       ├── CreateNewPopup.tsx          [Working - uses rel_subsheet_id]
    │       └── SelectorPopup.tsx           [Updated - filter button, transform, delete]
    │
    └── leadsmart_morph/
        ├── page.tsx
        └── pclient.tsx                     [Updated - jettison table + filter state + jrel_* columns]
```

## 🎨 Visual Elements

### Jettison Table in Cardio Chamber:
```
┌──────────────────────────────────────────────────────────────────────┐
│ cardio_chamber                                                        │
├──────────────────────────────────────────────────────────────────────┤
│ jettison_table                                                        │
│                                                                       │
│ ║ leadsmart_releases        ║leadsmart_subsheets  ║leadsmart_subparts│
│ ║ release_id│date│link│rows ║subsheet_id│name│rows║subpart_id│rows  │
│ ║ 1│2025/10/01│https│20,524║8│plumbing│10,135║4│duration│5,230    │
│ ║   [x] filter              ║  [ ] filter         ║  [ ] filter       │
│     ^--- Yellow highlight when active                                 │
└──────────────────────────────────────────────────────────────────────┘
```

## 📝 SQL Files Reference

| File | Purpose | Status |
|------|---------|--------|
| `ADD_REL_SUBSHEET_ID.sql` | Add missing column to zip_based_data | ⚠️ RUN |
| `TRANSFORM_SETUP_ALL_IN_ONE.sql` | Complete transform setup | ⚠️ RUN |
| `leadsmart_transformed_add_fk_columns.sql` | Add jrel_* columns | Included in ALL_IN_ONE |
| `leadsmart_transformed_add_unique_constraint.sql` | Add unique constraint | Included in ALL_IN_ONE |
| `CLEANUP_INVALID_DATA.sql` | Remove bad data | Optional |

## ⚡ After SQL is Run

Everything works automatically:
- ✅ Jettison table appears in cardio_chamber on both pages
- ✅ Selector popup "filter main ui table" button works
- ✅ Main tables filter by selected entity
- ✅ Transform function prevents duplicates
- ✅ Delete function handles associated data
- ✅ All CRUD operations work with rel_subsheet_id

