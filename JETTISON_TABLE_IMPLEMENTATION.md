# LeadSmart Jettison Table Implementation

## Overview

The **LeadSmartJettisonTable** is a central filtering component that appears in the **cardio_chamber** on both:
- `/leadsmart_tank` - filters `leadsmart_zip_based_data` using `rel_*` columns
- `/leadsmart_morph` - filters `leadsmart_transformed` using `jrel_*` columns

## Component Location

**File:** `/app/components/LeadSmartJettisonTable.tsx`

This component is shared between both pages with different configurations.

## Features

### ✅ Hierarchical Display
- Shows **Release → Subsheet → Subpart** hierarchy
- Each section shows detailed data about the selected entity
- Auto-populates child entities (lowest ID) when parent is selected

### ✅ Single Filter Selection
- Only ONE filter button can be active at a time
- Yellow background (#ffff99) highlights the active filter cell
- Filter applies to the main UI table grid on the page

### ✅ Dynamic Data Loading
- Populated when user clicks "filter main ui table" from Selector Popup
- Fetches entity data and calculates row counts
- Shows child counts for releases and subsheets

### ✅ Dual Configuration System
Works differently on each page:

| Page | Target Table | Column Prefix | Filters |
|------|-------------|---------------|---------|
| `/leadsmart_tank` | `leadsmart_zip_based_data` | `rel_` | Source data |
| `/leadsmart_morph` | `leadsmart_transformed` | `jrel_` | Transformed data |

## Table Structure

### 3 Column Sections (separated by 4px black vertical bars):

#### Section 1: leadsmart_releases
- `release_id`
- `release_date`
- `sheet_link`
- `rows` (total rows count) - blue bold
- `children` (subsheets count) - green bold
- `filter` button (checkbox + "filter" button)

#### Section 2: leadsmart_subsheets
- `subsheet_id`
- `subsheet_name`
- `rows` (total rows count) - blue bold
- `children` (subparts count) - green bold
- `filter` button (checkbox + "filter" button)

#### Section 3: leadsmart_subparts
- `subpart_id`
- `payout_note`
- `subpart_name`
- `rows` (total rows count) - blue bold
- `filter` button (checkbox + "filter" button)

## User Flow

### Step 1: Open Selector Popup
User clicks "selector popup" button in mandible_chamber

### Step 2: Select Entity
User clicks `select_x` on a release/subsheet/subpart in the popup

### Step 3: Apply Filter
User clicks "filter main ui table" button (green)

### Step 4: Jettison Table Populates
Event is dispatched → LeadSmartJettisonTable receives it → Fetches data

**What Happens:**
1. **Release selected:** 
   - Release data appears in section 1
   - First subsheet (lowest ID) appears in section 2
   - First subpart (lowest ID of that subsheet) appears in section 3
   - Filter button in section 1 is active (yellow bg)

2. **Subsheet selected:**
   - Parent release appears in section 1
   - Subsheet data appears in section 2
   - First subpart (lowest ID) appears in section 3
   - Filter button in section 2 is active (yellow bg)

3. **Subpart selected:**
   - Grandparent release appears in section 1
   - Parent subsheet appears in section 2
   - Subpart data appears in section 3
   - Filter button in section 3 is active (yellow bg)

### Step 5: Main UI Table Filters
The main UI table grid automatically filters to show only rows matching the selected entity:

**On `/leadsmart_tank`:**
```sql
SELECT * FROM leadsmart_zip_based_data 
WHERE rel_release_id = 1  -- if release selected
   OR rel_subsheet_id = 5  -- if subsheet selected
   OR rel_subpart_id = 3   -- if subpart selected
```

**On `/leadsmart_morph`:**
```sql
SELECT * FROM leadsmart_transformed 
WHERE jrel_release_id = 1   -- if release selected
   OR jrel_subsheet_id = 5  -- if subsheet selected
   OR jrel_subpart_id = 3   -- if subpart selected
```

### Step 6: Change Filter (Optional)
User can click any other filter button in the jettison table to switch filters immediately

## Technical Implementation

### Event System

**Event Dispatched:** `jettison-filter-apply`
```javascript
window.dispatchEvent(new CustomEvent('jettison-filter-apply', {
  detail: { type: 'release', id: 1 }
}));
```

**Triggered From:** SelectorPopup → "filter main ui table" button

**Received By:** LeadSmartJettisonTable component

### Props Interface

```typescript
interface JettisonConfig {
  targetTable: 'leadsmart_zip_based_data' | 'leadsmart_transformed';
  relColumnPrefix: 'rel_' | 'jrel_';
}

interface Props {
  config: JettisonConfig;
  onFilterChange?: (
    filterType: 'release' | 'subsheet' | 'subpart' | null, 
    filterId: number | null
  ) => void;
}
```

### State Management

Each page (leadsmart_tank/leadsmart_morph) manages its own filter state:

```typescript
const [jettisonFilter, setJettisonFilter] = useState<{
  type: 'release' | 'subsheet' | 'subpart' | null;
  id: number | null;
}>({ type: null, id: null });
```

This state is passed to the respective table component to filter the data.

## Styling

### Active Filter Cell
- Background: `#ffff99` (yellow)
- Applied to entire row in the active section

### Count Numbers
- **Rows count** (total): Blue bold (`#2563eb`)
- **Children count** (qty): Green bold (`#059669`)

### Vertical Separators
- Width: `4px`
- Color: Black
- Between each of the 3 column sections

### Filter Button
- Blue background (`bg-blue-600`)
- Height: `32px`
- No border radius (square edges)
- Adjoins checkbox on left with no gap

## Empty State

When no entity is selected for a section:
- All `<td>` cells show `"-"` as filler
- `<th>` cells remain showing their column names
- Filter button is not rendered

## Example Data Display

```
┌─────────────────────────────────────────────────────────────────────────────────┐
│ jettison_table                                                                   │
├─────────────────────────────────────────────────────────────────────────────────┤
│ leadsmart_releases   │leadsmart_subsheets│leadsmart_subparts                    │
│ release_id | date    │ subsheet_id |name │ subpart_id |note  │name   │rows      │
├─────────────────────────────────────────────────────────────────────────────────┤
│ 1 │2025/10/01│https..│ 20,524│2│[filter]││ 8│plumbing│10,135│2│[filter]││ 4│dur..│
└─────────────────────────────────────────────────────────────────────────────────┘
        ↑ Yellow background if this filter is active
```

## Files Modified

### New Files:
1. `/app/components/LeadSmartJettisonTable.tsx` - Main component

### Updated Files:
1. `/app/(protected)/leadsmart_tank/pclient.tsx`
   - Added LeadSmartJettisonTable to cardio_chamber
   - Added jettisonFilter state
   - Passes filter to LeadsmartTankTable

2. `/app/(protected)/leadsmart_tank/components/LeadsmartTankTable.tsx`
   - Accepts jettisonFilter prop
   - Filters data based on active jettison filter

3. `/app/(protected)/leadsmart_morph/pclient.tsx`
   - Added LeadSmartJettisonTable to cardio_chamber
   - Added jettisonFilter state
   - Filters transformed data based on jettison filter
   - Added Selector Popup button

4. `/app/(protected)/leadsmart_tank/components/SelectorPopup.tsx`
   - "filter main ui table" button now enabled (green)
   - Dispatches `jettison-filter-apply` event
   - Closes popup after applying filter

## SQL Prerequisites

Before using this feature, run:

```sql
-- Add jrel_* columns to leadsmart_transformed
ALTER TABLE leadsmart_transformed
ADD COLUMN jrel_release_id INTEGER REFERENCES leadsmart_file_releases(release_id) ON DELETE SET NULL,
ADD COLUMN jrel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL,
ADD COLUMN jrel_subpart_id INTEGER REFERENCES leadsmart_subparts(subpart_id) ON DELETE SET NULL;

-- Create indexes
CREATE INDEX idx_leadsmart_transformed_jrel_release_id ON leadsmart_transformed(jrel_release_id);
CREATE INDEX idx_leadsmart_transformed_jrel_subsheet_id ON leadsmart_transformed(jrel_subsheet_id);
CREATE INDEX idx_leadsmart_transformed_jrel_subpart_id ON leadsmart_transformed(jrel_subpart_id);

-- Add rel_subsheet_id to leadsmart_zip_based_data
ALTER TABLE leadsmart_zip_based_data
ADD COLUMN rel_subsheet_id INTEGER REFERENCES leadsmart_subsheets(subsheet_id) ON DELETE SET NULL;

CREATE INDEX idx_leadsmart_zip_based_data_rel_subsheet_id ON leadsmart_zip_based_data(rel_subsheet_id);
```

Or run: `TRANSFORM_SETUP_ALL_IN_ONE.sql` and `ADD_REL_SUBSHEET_ID.sql`

## Testing

### Test on /leadsmart_tank:
1. Navigate to `/leadsmart_tank`
2. Click "selector popup"
3. Select a release via `select_x`
4. Click "filter main ui table"
5. Verify jettison table populates in cardio_chamber
6. Verify main table filters to show only that release's data

### Test on /leadsmart_morph:
1. Navigate to `/leadsmart_morph`
2. Click "selector popup"
3. Select a subpart via `select_x`
4. Click "filter main ui table"
5. Verify jettison table populates with all 3 levels
6. Verify main table filters to show only that subpart's transformed data

### Test Filter Switching:
1. Click a different filter button in jettison table
2. Yellow highlight should move to new selection
3. Main table should update instantly

## Benefits

### 🎯 Visual Filtering
Users can see exactly what's being filtered at a glance

### 🔗 Context Awareness
Shows the full hierarchy (release → subsheet → subpart)

### ⚡ Quick Switching
Click any filter button to instantly switch filters

### 📊 Data Transparency
Row counts and child counts visible for each entity

### 🔄 Reusable Component
Same component works on both pages with different configs

