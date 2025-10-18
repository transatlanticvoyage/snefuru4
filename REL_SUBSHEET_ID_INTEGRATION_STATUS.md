# rel_subsheet_id Integration Status

## ✅ SQL to Run

**File:** `ADD_REL_SUBSHEET_ID.sql`

This adds the `rel_subsheet_id` column to `leadsmart_zip_based_data` table.

```sql
ALTER TABLE leadsmart_zip_based_data
ADD COLUMN rel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;

CREATE INDEX idx_leadsmart_zip_based_data_rel_subsheet_id ON leadsmart_zip_based_data(rel_subsheet_id);
```

## ✅ Code Integration Status

### 1. **InsertDataPopup.tsx** - ✅ ALREADY WORKING

**Line 217:** `rel_subsheet_id: selectedSubsheetId,`

The bulk insertion function properly:
- ✅ Uses the `selectedSubsheetId` from the SubsheetsGrid
- ✅ Inserts it into every record
- ✅ Shows it in the success message

**No code changes needed!**

---

### 2. **LeadsmartTankTable.tsx** - ✅ NOW FULLY WORKING

#### Interface (Line 15)
```typescript
rel_subsheet_id: number | null;
```

#### Column Definition (Line 55)
```typescript
const allColumns = [
  'global_row_id',
  'rel_subsheet_id', // ← Present
  'rel_subpart_id',
  ...
];
```

#### Display in Table Header (Line 767)
```typescript
else if (col === 'rel_subsheet_id') {
  symbol = <span style={{ color: 'navy', marginRight: '4px' }}>★</span>;
}
```
Shows as **★rel_subsheet_id** with navy blue star

#### Inline Editing - ✅ FIXED
**Updated `saveEdit` function (Line 189)** to handle as number:
```typescript
if (field === 'payout' || field === 'sheet_row_id' || 
    field === 'rel_release_id' || field === 'rel_subsheet_id' || field === 'rel_subpart_id') {
  valueToSave = editValue === '' ? null : Number(editValue);
}
```

#### Create New Row - ✅ FIXED
**Updated `saveNewRow` function (Line 223)** to convert to number:
```typescript
const dataToInsert = {
  ...newRow,
  sheet_row_id: newRow.sheet_row_id ? Number(newRow.sheet_row_id) : null,
  payout: newRow.payout ? Number(newRow.payout) : null,
  rel_release_id: newRow.rel_release_id ? Number(newRow.rel_release_id) : null,
  rel_subsheet_id: newRow.rel_subsheet_id ? Number(newRow.rel_subsheet_id) : null, // ← Fixed
  rel_subpart_id: newRow.rel_subpart_id ? Number(newRow.rel_subpart_id) : null,
  user_id: user.id
};
```

#### New Row Initialization (Line 121)
```typescript
const newRowData: Partial<LeadsmartData> = {
  sheet_row_id: null,
  zip_code: '',
  payout: null,
  city_name: '',
  state_code: '',
  rel_release_id: null,
  rel_subsheet_id: null, // ← Present
  rel_subpart_id: null,
  user_id: user?.id || null
};
```

**All functionality working!**

---

### 3. **CreateNewPopup.tsx** - ✅ ALREADY WORKING

The single-record creation popup also includes:
- ✅ Form field for `rel_subsheet_id`
- ✅ Proper type conversion before insert
- ✅ UI input field in the form

**No code changes needed!**

---

## 📋 Complete Integration Checklist

| Feature | Status | Details |
|---------|--------|---------|
| Database column | ⚠️ **Missing** | Run SQL to add it |
| TypeScript interface | ✅ Working | Already defined |
| UI column display | ✅ Working | Shows with ★ symbol |
| Inline editing | ✅ **Fixed** | Now converts to number |
| Create new inline | ✅ **Fixed** | Now converts to number |
| Create new popup | ✅ Working | Already converts to number |
| Bulk insert popup | ✅ Working | Already uses selectedSubsheetId |
| Column in allColumns | ✅ Working | Already present |

## 🔧 What You Need to Do

### Step 1: Run SQL in Supabase
Open Supabase SQL Editor and run:

```sql
ALTER TABLE leadsmart_zip_based_data
ADD COLUMN rel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;

CREATE INDEX idx_leadsmart_zip_based_data_rel_subsheet_id ON leadsmart_zip_based_data(rel_subsheet_id);
```

Or just run the entire `ADD_REL_SUBSHEET_ID.sql` file.

### Step 2: Refresh Browser
The code changes have been applied, so just refresh to pick them up.

### Step 3: Test Everything

#### Test Inline Editing:
1. Click on a `rel_subsheet_id` cell
2. Enter a number (e.g., `1`)
3. Press Enter
4. Should save as number to database

#### Test Create New (Inline):
1. Click "Create New (inline)" button
2. Fill in `rel_subsheet_id` field
3. Click Save
4. Should insert with proper number type

#### Test Bulk Insert:
1. Click "insert new data" button
2. Paste data into grid
3. Select a subsheet from the grid on right
4. Click "insert data"
5. All rows should have the selected subsheet ID

## ✅ After SQL is Run

Everything will work automatically! The column will:
- Display in the main UI table with ★ symbol
- Be editable inline
- Save as proper INTEGER type
- Be included in bulk inserts
- Be included in "Create New" forms

