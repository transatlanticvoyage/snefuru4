# City ID Fields Implementation Summary

**Date:** October 17, 2025  
**Feature:** Add `rel_largest_city_id` and `rel_exact_city_id` to keywordshub table

---

## Overview

This implementation adds two new database columns to the `keywordshub` table that automatically populate when the F370 function runs on the `/fabric` page. These columns track city associations based on the keyword rubric template used.

---

## Database Changes

### New Columns Added to `keywordshub` Table:

1. **`rel_largest_city_id`** (INTEGER, nullable)
   - Foreign key to `cities.city_id`
   - Populated when `(city_name)` shortcode is used in kw_rubric
   - Contains the city_id of the city with the **largest population** matching the city_name
   - Purpose: Track the most populous city with a given name (e.g., Springfield)

2. **`rel_exact_city_id`** (INTEGER, nullable)
   - Foreign key to `cities.city_id`
   - Populated when **both** `(city_name)` AND `(state_code)` shortcodes are used in kw_rubric
   - Contains the city_id of the exact city matching both criteria
   - Purpose: Track the precise city-state combination

### Database Migration File:

**File:** `add_city_id_columns_to_keywordshub.sql`

```sql
ALTER TABLE keywordshub 
  ADD COLUMN IF NOT EXISTS rel_largest_city_id INTEGER,
  ADD COLUMN IF NOT EXISTS rel_exact_city_id INTEGER;

-- Foreign key constraints
ALTER TABLE keywordshub 
  ADD CONSTRAINT fk_keywordshub_rel_largest_city_id 
  FOREIGN KEY (rel_largest_city_id) REFERENCES cities(city_id);

ALTER TABLE keywordshub 
  ADD CONSTRAINT fk_keywordshub_rel_exact_city_id 
  FOREIGN KEY (rel_exact_city_id) REFERENCES cities(city_id);

-- Performance indexes
CREATE INDEX IF NOT EXISTS idx_keywordshub_rel_largest_city_id 
  ON keywordshub(rel_largest_city_id);

CREATE INDEX IF NOT EXISTS idx_keywordshub_rel_exact_city_id 
  ON keywordshub(rel_exact_city_id);
```

**To Run:** Execute this SQL in your Supabase SQL Editor.

---

## Logic Implementation

### Location in Code:

**File:** `app/api/f370/route.ts`  
**Lines:** 190-223 (new logic inserted)

### How It Works:

#### 1. **Exact City Match (`rel_exact_city_id`)**

**Trigger Condition:**  
When the kw_rubric contains BOTH `(city_name)` AND `(state_code)` shortcodes

**Logic:**
```typescript
const hasBothShortcodes = kw_rubric.includes('(city_name)') && kw_rubric.includes('(state_code)');
if (hasBothShortcodes) {
  // Use the source city from cncglub row
  rel_exact_city_id = row.rel_city_id;
}
```

**Example:**
- Rubric: `"deck builder (city_name) (state_code)"`
- Processing: `cncglub` row with `rel_city_id = 12345` (Portland, OR)
- Result: `rel_exact_city_id = 12345`

---

#### 2. **Largest City Match (`rel_largest_city_id`)**

**Trigger Condition:**  
When the kw_rubric contains `(city_name)` shortcode (regardless of state_code)

**Logic:**
```typescript
if (kw_rubric.includes('(city_name)')) {
  const { data: largestCity } = await supabase
    .from('cities')
    .select('city_id, city_population')
    .eq('city_name', city.city_name)
    .order('city_population', { ascending: false })
    .limit(1)
    .maybeSingle();

  if (largestCity) {
    rel_largest_city_id = largestCity.city_id;
  }
}
```

**Example:**
- Rubric: `"deck builder (city_name)"`
- Processing: `Springfield, IL` (population 114,000)
- Query finds: `Springfield, IL` (pop: 114,000), `Springfield, MA` (pop: 155,000), `Springfield, MO` (pop: 169,000)
- Result: `rel_largest_city_id = <city_id for Springfield, MO>`

---

### Integration Points:

1. **Before Keyword Creation/Update:**
   - Logic determines city ID values based on rubric shortcodes
   - Variables `rel_exact_city_id` and `rel_largest_city_id` are set

2. **During Keyword Creation:**
   ```typescript
   .insert({
     keyword_datum: renderedKeyword,
     // ... other fields ...
     rel_exact_city_id,
     rel_largest_city_id
   })
   ```

3. **During Keyword Update (Existing Keywords):**
   ```typescript
   .update({ 
     rel_industry_id: row.rel_industry_id,
     cached_city_name: city.city_name,
     rel_exact_city_id,
     rel_largest_city_id
   })
   ```

---

## Usage Scenarios

### Scenario 1: National Keyword (City Only)

**Rubric:** `"best plumber in (city_name)"`

**Results:**
- ✅ `rel_largest_city_id` = city_id of largest city with that name
- ❌ `rel_exact_city_id` = NULL (no state_code specified)

**Use Case:** When you want to rank nationally and target the most populous version of each city name.

---

### Scenario 2: State-Specific Keyword

**Rubric:** `"plumber (city_name) (state_code)"`

**Results:**
- ✅ `rel_exact_city_id` = exact city_id for city + state combo
- ✅ `rel_largest_city_id` = largest city_id matching city_name

**Use Case:** When you want precise city-state targeting plus a reference to the most populous namesake.

---

### Scenario 3: No City Reference

**Rubric:** `"best plumbers nationwide"`

**Results:**
- ❌ `rel_exact_city_id` = NULL
- ❌ `rel_largest_city_id` = NULL

**Use Case:** National or non-geographic keywords.

---

## Error Handling

1. **Largest City Query Fails:**
   - Wrapped in try-catch
   - Continues processing with `rel_largest_city_id = null`
   - Logs error but doesn't abort F370 process

2. **No Matching City Found:**
   - `maybeSingle()` returns null
   - Fields remain null
   - Process continues normally

3. **Database Constraints:**
   - Foreign keys ensure referential integrity
   - Invalid city_id will cause insert/update to fail with clear error message

---

## Console Logging

**Added Debug Logs:**
```typescript
// Exact city match
console.log(`Exact city match: ${city.city_name}, ${city.state_code} (city_id: ${rel_exact_city_id})`);

// Largest city match
console.log(`Largest city match for "${city.city_name}": city_id ${rel_largest_city_id} with population ${largestCity.city_population}`);
```

**View Logs:** Check browser console when running F370 to see city matching in real-time.

---

## Testing Checklist

### Database Setup:
- [ ] Run `add_city_id_columns_to_keywordshub.sql` in Supabase SQL Editor
- [ ] Verify columns exist: Check keywordshub table schema
- [ ] Verify foreign keys: Check constraints in database

### F370 Function Tests:

#### Test 1: Both Shortcodes
- [ ] Rubric: `"plumber (city_name) (state_code)"`
- [ ] Run F370 with filters
- [ ] Verify: Both `rel_exact_city_id` and `rel_largest_city_id` populated
- [ ] Verify: `rel_exact_city_id` matches source cncglub city

#### Test 2: City Only
- [ ] Rubric: `"plumber (city_name)"`
- [ ] Run F370 with filters
- [ ] Verify: `rel_largest_city_id` populated
- [ ] Verify: `rel_exact_city_id` is NULL
- [ ] Verify: Largest city is actually largest (check city_population)

#### Test 3: No Shortcodes
- [ ] Rubric: `"plumber service"`
- [ ] Run F370 with filters
- [ ] Verify: Both fields are NULL

#### Test 4: Existing Keywords
- [ ] Run F370 twice with same criteria
- [ ] Verify: Existing keywords get updated with city IDs
- [ ] Verify: No duplicate keywords created

---

## Performance Impact

**Per Keyword Processing:**
- **Exact City:** No additional queries (uses existing `row.rel_city_id`)
- **Largest City:** +1 query (indexed lookup on city_name)

**Estimated Impact:**
- Processing 1,000 keywords: ~1-2 seconds additional time
- Processing 10,000 keywords: ~10-20 seconds additional time

**Optimization:**
- `city_name` should be indexed in `cities` table for optimal performance
- Query uses `.limit(1)` to return only the top result

---

## Future UI Display (Not Yet Implemented)

**Planned for `/kwjar` page:**
- New columns in KeywordsHubTable to display `rel_exact_city_id` and `rel_largest_city_id`
- Potential joined city data to show city name + population
- Filter/sort capabilities on these new fields

**Note:** UI updates will be implemented in a future task per user instructions.

---

## Files Modified

1. ✅ **Created:** `add_city_id_columns_to_keywordshub.sql` (database migration)
2. ✅ **Modified:** `app/api/f370/route.ts` (F370 function logic)
3. ✅ **Created:** `IMPLEMENTATION_CITY_ID_FIELDS.md` (this documentation)

---

## Rollback Instructions

If you need to remove these changes:

```sql
-- Remove the new columns
ALTER TABLE keywordshub DROP COLUMN IF EXISTS rel_largest_city_id;
ALTER TABLE keywordshub DROP COLUMN IF EXISTS rel_exact_city_id;

-- Indexes and constraints will be automatically dropped with the columns
```

Then revert the changes to `app/api/f370/route.ts` using git:
```bash
git checkout HEAD -- app/api/f370/route.ts
```

---

## Status: ✅ COMPLETE

All backend implementation is complete and ready for testing. UI updates will follow in a future task.

