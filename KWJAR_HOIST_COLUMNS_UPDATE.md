# /kwjar Hoist Columns Update

**Date:** October 17, 2025  
**Feature:** Update hoist columns to display city data via rel_largest_city_id

---

## Summary

Updated the three hoist columns in the `/kwjar` KeywordsHubTable to display:
1. `rel_largest_city_id` (the city ID itself)
2. Metro population from the largest city
3. City population from the largest city

---

## Changes Made

### Column Definitions Updated

**Before:**
- `hoist_note1` → displayed nothing
- `hoist_ven_metro_pop` → displayed nothing
- `hoist_ven_city_pop` → displayed nothing

**After:**
- `rel_largest_city_id` → displays the city_id value from keywordshub table
- `largest_city.metro_population` → displays metro_population from cities table (via rel_largest_city_id foreign key)
- `largest_city.city_population` → displays city_population from cities table (via rel_largest_city_id foreign key)

### Column Headers Updated

**Before:**
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| note1 | ven_metro_pop | ven_city_pop |

**After:**
| Column 1 | Column 2 | Column 3 |
|----------|----------|----------|
| rel_largest_city_id | metro pop | city pop |

---

## Technical Implementation

### 1. Column Configuration (Lines 78-106)

```typescript
{ 
  key: 'rel_largest_city_id', 
  label: 'rel_largest_city_id', 
  type: 'number',
  headerRow1Text: 'hoist',
  headerRow2Text: 'rel_largest_city_id',
  readOnly: true,
  isHoistColumn: true
},
{ 
  key: 'largest_city.metro_population', 
  label: 'metro pop', 
  type: 'number',
  headerRow1Text: 'hoist',
  headerRow2Text: 'metro pop',
  readOnly: true,
  isHoistColumn: true,
  isJoined: true
},
{ 
  key: 'largest_city.city_population', 
  label: 'city pop', 
  type: 'number',
  headerRow1Text: 'hoist',
  headerRow2Text: 'city pop',
  readOnly: true,
  isHoistColumn: true,
  isJoined: true
}
```

### 2. TypeScript Interface Updated (Lines 30-45)

Added to `KeywordRecord` interface:
```typescript
rel_largest_city_id: number | null;
rel_exact_city_id: number | null;
// Joined largest city data
largest_city?: {
  metro_population: number | null;
  city_population: number | null;
} | null;
```

### 3. Database Query Updated (Lines 430-441)

Added joined city data to the SELECT query:
```typescript
let query = supabase
  .from('keywordshub')
  .select(`
    *,
    industries:rel_industry_id (
      industry_name
    ),
    largest_city:rel_largest_city_id (
      metro_population,
      city_population
    )
  `);
```

### 4. Sticky Column Keys Updated (Line 662)

```typescript
const hoistColumnKeys = ['rel_largest_city_id', 'largest_city.metro_population', 'largest_city.city_population'];
```

### 5. Render Cell Logic Updated (Lines 1367-1369)

Added handling for `largest_city` joined data:
```typescript
else if (table === 'largest_city' && item.largest_city) {
  value = (item.largest_city as any)[field];
}
```

---

## How Data Displays

### When rel_largest_city_id is NOT NULL:

| rel_largest_city_id | metro pop | city pop |
|---------------------|-----------|----------|
| 12345 | 2,500,000 | 850,000 |

**Example:**
- Keyword: "deck builder Springfield"
- F370 found largest Springfield (MO, population 169,000)
- `rel_largest_city_id = 12345`
- Displays city_id and population data from cities table

### When rel_largest_city_id is NULL:

| rel_largest_city_id | metro pop | city pop |
|---------------------|-----------|----------|
| (empty) | (empty) | (empty) |

**Example:**
- Keyword: "deck builder nationwide"
- No (city_name) shortcode used in rubric
- `rel_largest_city_id = NULL`
- All three columns display empty

---

## Visual Appearance

- **Hoist columns** maintain their polka-dot beige pattern background
- **Column headers** show "hoist" in row 1, specific field names in row 2
- **Numbers** are formatted with thousands separators (e.g., 2,500,000)
- **Empty values** display as blank cells (not "null" or "0")
- **Positioning**: Hoist columns appear between `keyword_id` and `keyword_datum`

---

## Data Flow

1. **F370 Function** runs on `/fabric` page
   - Populates `keywordshub.rel_largest_city_id` based on rubric shortcodes
   - Stores city_id of the most populous city matching the city_name

2. **Database Join** in `/kwjar` query
   - Supabase joins `cities` table via `rel_largest_city_id` foreign key
   - Fetches `metro_population` and `city_population` fields

3. **Table Display**
   - `rel_largest_city_id`: Shows the numeric ID from keywordshub
   - `metro pop`: Shows metro_population from joined cities table
   - `city pop`: Shows city_population from joined cities table

---

## Toggle Behavior

**Hoist Columns Toggle** (in mandible_chamber):
- ✅ **ON**: Shows all three hoist columns
- ❌ **OFF**: Hides all three hoist columns entirely

This toggle setting is stored in localStorage as `kwjar_showHoistColumns`.

---

## Use Cases

### Use Case 1: National SEO Campaign
**Scenario:** Marketing agency creates keywords for "Springfield" across the US

**What They See:**
- Keywords like "plumber Springfield"
- `rel_largest_city_id` shows which Springfield was selected as "largest"
- Metro/city pop shows the population data for verification
- Can compare across different city names to prioritize markets

### Use Case 2: Data Quality Check
**Scenario:** Verify F370 function correctly identified largest cities

**What They See:**
- Sort by `metro pop` descending
- Verify largest cities are actually the most populous
- Identify any NULL values indicating missing city associations

### Use Case 3: Market Segmentation
**Scenario:** Filter keywords by city size for different campaigns

**What They See:**
- Filter by `city pop` ranges (e.g., > 100,000)
- Group keywords by metro area size
- Separate small town vs. major city keywords

---

## Testing Checklist

### Display Tests:
- [ ] Hoist columns visible when toggle is ON
- [ ] Hoist columns hidden when toggle is OFF
- [ ] Polka-dot pattern appears on hoist column headers
- [ ] Column headers show correct text ("rel_largest_city_id", "metro pop", "city pop")
- [ ] Numbers display with thousands separators

### Data Tests:
- [ ] `rel_largest_city_id` shows actual city_id values from keywordshub
- [ ] Metro population shows correct values when rel_largest_city_id is not NULL
- [ ] City population shows correct values when rel_largest_city_id is not NULL
- [ ] All three columns are empty when rel_largest_city_id is NULL
- [ ] Joined data matches the cities table records

### Interaction Tests:
- [ ] Columns are read-only (no editing)
- [ ] Can sort by rel_largest_city_id
- [ ] Can sort by metro_population
- [ ] Can sort by city_population
- [ ] Search function includes these column values

---

## File Modified

**File:** `app/(protected)/kwjar/components/KeywordsHubTable.tsx`

**Lines Changed:**
- 30-45: Interface updated
- 78-106: Column definitions updated
- 430-441: Query updated
- 662: Sticky column keys updated
- 1367-1369: Render cell logic updated

---

## Related Features

**Depends on:**
- ✅ `rel_largest_city_id` field in keywordshub table (from previous implementation)
- ✅ `metro_population` field in cities table
- ✅ `city_population` field in cities table
- ✅ Foreign key relationship between keywordshub and cities

**Works with:**
- ✅ F370 function on `/fabric` page (populates the city IDs)
- ✅ Hoist columns toggle in mandible_chamber
- ✅ Column pagination system
- ✅ Table sorting and filtering

---

## Notes

- These are **read-only** columns - users cannot edit them directly
- Values are populated automatically by F370 function on `/fabric` page
- Columns display numeric data with proper formatting
- Foreign key join ensures data integrity
- Gracefully handles NULL values (displays as empty)

---

## Status: ✅ COMPLETE

All UI updates are complete. The hoist columns now display city data based on `rel_largest_city_id`.

