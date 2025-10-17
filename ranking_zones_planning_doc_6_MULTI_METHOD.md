# RANKING ZONES SYSTEM - PLANNING DOCUMENT 6

**Status**: Multi-Method Architecture Design  
**Date**: October 16, 2025  
**Purpose**: Adapt architecture to support multiple EMD stamp methods

---

## EXECUTIVE SUMMARY

### The Future Requirement

You'll have **multiple EMD detection methods**:
- Method 1: `is_match_emd_stamp` (current F410)
- Method 2: `is_match_emd_stamp_2` (future F411)
- Method 3: `is_match_emd_stamp_3` (future F412)
- Method N: `is_match_emd_stamp_N` (future F41N)

Each method needs its own:
- ✅ UI column set (counts + domains) on `/kwjar`
- ✅ Data storage for zone analysis
- ✅ Independent tracking per method

---

## YOUR ORIGINAL DESIGN vs OUR DESIGN

### Your Original: "Kernel" Approach

```sql
CREATE TABLE serp_zone_kernels (
  kernel_id SERIAL PRIMARY KEY,
  rel_keyword_id INTEGER,
  zone_definition VARCHAR(10),        -- '1', '2', '3', '4_10', etc.
  emd_stamp_method VARCHAR(50),       -- 'emd-stamp-method-1', 'emd-stamp-method-2'
  count_of_emd_stamped_results INTEGER,
  emd_detailed_data JSONB,
  UNIQUE (rel_keyword_id, zone_definition, emd_stamp_method)
);

CREATE TABLE relations_zhe_serp_results_to_ranking_zone_kernels (
  relation_id SERIAL PRIMARY KEY,
  result_id INTEGER,
  kernel_id INTEGER
);
```

**Example Data for keyword 2348, method-1:**
| kernel_id | rel_keyword_id | zone_definition | emd_stamp_method | count | emd_detailed_data |
|-----------|----------------|-----------------|------------------|-------|-------------------|
| 93 | 2348 | 1 | emd-stamp-method-1 | 1 | `[{"domain": "pest.com", "rank": 1, "result_id": 124}]` |
| 94 | 2348 | 2 | emd-stamp-method-1 | 0 | `[]` |
| 95 | 2348 | 3 | emd-stamp-method-1 | 1 | `[...]` |
| 96 | 2348 | 4_10 | emd-stamp-method-1 | 2 | `[...]` |
| 97 | 2348 | 11_25 | emd-stamp-method-1 | 0 | `[]` |
| 98 | 2348 | 26_50 | emd-stamp-method-1 | 1 | `[...]` |
| 99 | 2348 | 51_100 | emd-stamp-method-1 | 3 | `[...]` |

**Pros:**
- ✅ Very flexible - each zone is independent
- ✅ Easy to query specific zone+method
- ✅ Natural multi-method support

**Cons:**
- ❌ 7 rows per keyword per method (210K rows for 10K keywords × 3 methods)
- ❌ UI query must aggregate 7 rows per keyword
- ❌ More complex to display in table

---

### Our Design: "Cache Row Per Method"

```sql
CREATE TABLE keywordshub_emd_zone_cache (
  cache_id SERIAL PRIMARY KEY,
  keyword_id INTEGER,
  emd_method VARCHAR(50),               -- 'method-1', 'method-2', 'method-3'
  latest_fetch_id INTEGER,
  
  -- All zones in one row
  total_emd_sites INTEGER,
  zone_1_count INTEGER,
  zone_2_count INTEGER,
  zone_3_count INTEGER,
  zone_4_10_count INTEGER,
  zone_11_25_count INTEGER,
  zone_26_50_count INTEGER,
  zone_51_100_count INTEGER,
  
  zone_1_domains JSONB,
  zone_2_domains JSONB,
  zone_3_domains JSONB,
  zone_4_10_domains JSONB,
  zone_11_25_domains JSONB,
  zone_26_50_domains JSONB,
  zone_51_100_domains JSONB,
  
  cached_at TIMESTAMP DEFAULT NOW(),
  UNIQUE (keyword_id, emd_method)
);
```

**Example Data for keyword 2348, method-1 (ONE ROW):**
| cache_id | keyword_id | emd_method | total | z1_count | z2_count | z3_count | z4_10_count | ... | z1_domains | z2_domains | ... |
|----------|------------|------------|-------|----------|----------|----------|-------------|-----|------------|------------|-----|
| 501 | 2348 | method-1 | 8 | 1 | 0 | 1 | 2 | ... | `[...]` | `[]` | ... |
| 502 | 2348 | method-2 | 5 | 0 | 1 | 0 | 3 | ... | `[]` | `[...]` | ... |
| 503 | 2348 | method-3 | 12 | 2 | 1 | 2 | 4 | ... | `[...]` | `[...]` | ... |

**Pros:**
- ✅ Fewer rows (30K for 10K keywords × 3 methods)
- ✅ UI query is simple - one row has all data
- ✅ Fast to display in table

**Cons:**
- ⚠️ 15 columns per method (but that's fine)
- ⚠️ Can't query "just zone 4-10 for method-1" without loading whole row

---

## RECOMMENDED: HYBRID APPROACH

### Best of Both Worlds

Use **our cache design** (one row per keyword per method) but adapt the relations table to support multiple methods:

```sql
-- Table 1: Cache (one row per keyword per method)
CREATE TABLE keywordshub_emd_zone_cache (
  cache_id SERIAL PRIMARY KEY,
  keyword_id INTEGER NOT NULL,
  emd_method VARCHAR(50) NOT NULL,      -- NEW: Method identifier
  latest_fetch_id INTEGER,
  
  total_emd_sites INTEGER DEFAULT 0,
  zone_1_count INTEGER DEFAULT 0,
  zone_2_count INTEGER DEFAULT 0,
  zone_3_count INTEGER DEFAULT 0,
  zone_4_10_count INTEGER DEFAULT 0,
  zone_11_25_count INTEGER DEFAULT 0,
  zone_26_50_count INTEGER DEFAULT 0,
  zone_51_100_count INTEGER DEFAULT 0,
  
  zone_1_domains JSONB,
  zone_2_domains JSONB,
  zone_3_domains JSONB,
  zone_4_10_domains JSONB,
  zone_11_25_domains JSONB,
  zone_26_50_domains JSONB,
  zone_51_100_domains JSONB,
  
  cached_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (keyword_id, emd_method)       -- One cache row per keyword per method
);

-- Table 2: Relations (stores which results match which method)
CREATE TABLE keywordshub_serp_zone_emd_matches (
  match_id SERIAL PRIMARY KEY,
  keyword_id INTEGER NOT NULL,
  result_id INTEGER NOT NULL,
  zone_id INTEGER NOT NULL,
  emd_method VARCHAR(50) NOT NULL,      -- NEW: Method identifier
  created_at TIMESTAMP DEFAULT NOW(),
  
  UNIQUE (result_id, zone_id, emd_method)  -- Same result can match multiple methods
);
```

---

## EXAMPLE DATA: MULTIPLE METHODS

### Scenario: Keyword 1832 with 3 EMD Methods

**Method 1**: Standard EMD (emd_stamp_slug + city)
**Method 2**: Aggressive match (any pest-related keyword)
**Method 3**: Conservative match (exact brand name only)

### Table: `keywordshub_emd_zone_cache`

| cache_id | keyword_id | emd_method | total | z1_cnt | z2_cnt | z3_cnt | z4_10_cnt | z11_25_cnt | z1_domains | z4_10_domains |
|----------|------------|------------|-------|--------|--------|--------|-----------|------------|------------|---------------|
| 5001 | 1832 | method-1 | 5 | 1 | 0 | 1 | 2 | 1 | `[{"domain":"pestcontrol-batonrouge.com","rank":1,"result_id":4854}]` | `[{...}]` |
| 5002 | 1832 | method-2 | 12 | 2 | 1 | 2 | 4 | 3 | `[{...},{...}]` | `[{...},{...}]` |
| 5003 | 1832 | method-3 | 2 | 0 | 0 | 1 | 1 | 0 | `[]` | `[{...}]` |

### Table: `keywordshub_serp_zone_emd_matches`

| match_id | keyword_id | result_id | zone_id | emd_method | created_at |
|----------|------------|-----------|---------|------------|------------|
| 10001 | 1832 | 4854 | 1 | method-1 | 2025-10-16 14:35:22 |
| 10002 | 1832 | 4854 | 1 | method-2 | 2025-10-16 14:35:22 |
| 10003 | 1832 | 4856 | 3 | method-1 | 2025-10-16 14:35:22 |
| 10004 | 1832 | 4856 | 3 | method-2 | 2025-10-16 14:35:22 |
| 10005 | 1832 | 4856 | 3 | method-3 | 2025-10-16 14:35:22 |
| 10006 | 1832 | 4861 | 4 | method-1 | 2025-10-16 14:35:22 |
| 10007 | 1832 | 4861 | 4 | method-2 | 2025-10-16 14:35:22 |

**Note**: result_id 4854 matches both method-1 and method-2 (two separate match rows)

---

## UI DISPLAY WITH MULTIPLE METHODS

### /kwjar Page Layout

```
┌────────────┬──────────────────── METHOD 1 ────────────────────┬──────────────────── METHOD 2 ────────────────────┐
│  Keyword   │    Counts     │      Domains                     │    Counts     │      Domains                     │
│            ├───┬───┬───┬───┼───┬───┬───┬───┬───┬───┬───┬───────┼───┬───┬───┬───┼───┬───┬───┬───┬───┬───┬───┬──────┤
│            │tot│ 1 │ 2 │3  │4-10│ 1 │ 2 │ 3 │4-10│...│...│...│tot│ 1 │ 2 │ 3 │4-10│ 1 │ 2 │ 3 │4-10│...│...│...│
├────────────┼───┼───┼───┼───┼────┼───┼───┼───┼────┼───┼───┼───┼───┼───┼───┼───┼────┼───┼───┼───┼────┼───┼───┼───┤
│pest control│ 5 │ 1 │ 0 │ 1 │ 2  │ex1│ - │ex2│ex3 │...│...│...│12 │ 2 │ 1 │ 2 │ 4  │ex1│ex6│ex7│ex8 │...│...│...│
│baton rouge │   │   │   │   │    │   │   │   │ex4 │   │   │   │   │   │   │   │    │ex2│   │   │ex9 │   │   │   │
└────────────┴───┴───┴───┴───┴────┴───┴───┴───┴────┴───┴───┴───┴───┴───┴───┴───┴────┴───┴───┴───┴────┴───┴───┴───┘
```

### Single Query to Load All Methods

```sql
SELECT 
  k.keyword_id,
  k.keyword_datum,
  -- Method 1 data
  c1.total_emd_sites as m1_total,
  c1.zone_1_count as m1_z1_count,
  c1.zone_1_domains as m1_z1_domains,
  -- ... all zone columns for method 1
  
  -- Method 2 data
  c2.total_emd_sites as m2_total,
  c2.zone_1_count as m2_z1_count,
  c2.zone_1_domains as m2_z1_domains,
  -- ... all zone columns for method 2
  
  -- Method 3 data
  c3.total_emd_sites as m3_total,
  c3.zone_1_count as m3_z1_count,
  c3.zone_1_domains as m3_z1_domains
  -- ... all zone columns for method 3

FROM keywordshub k
LEFT JOIN keywordshub_emd_zone_cache c1 ON c1.keyword_id = k.keyword_id AND c1.emd_method = 'method-1'
LEFT JOIN keywordshub_emd_zone_cache c2 ON c2.keyword_id = k.keyword_id AND c2.emd_method = 'method-2'
LEFT JOIN keywordshub_emd_zone_cache c3 ON c3.keyword_id = k.keyword_id AND c3.emd_method = 'method-3'
WHERE k.keyword_tag_id = 17
ORDER BY k.keyword_id;
```

**Performance**: ~100ms for 1000 keywords × 3 methods (3 LEFT JOINs)

---

## ADDING A NEW METHOD (Future F412)

### Step 1: Add column to zhe_serp_results
```sql
ALTER TABLE zhe_serp_results
ADD COLUMN is_match_emd_stamp_3 BOOLEAN DEFAULT FALSE;
```

### Step 2: Create F412 API route
```typescript
// app/api/f412/route.ts
// Implements new matching logic for method-3
// Updates is_match_emd_stamp_3 = TRUE for matches
```

### Step 3: Update F420 to handle method-3
```typescript
// app/api/f420/route.ts
export async function POST(request: NextRequest) {
  const { keyword_id, emd_method } = await request.json();
  
  // Determine which column to check
  const matchColumn = {
    'method-1': 'is_match_emd_stamp',
    'method-2': 'is_match_emd_stamp_2',
    'method-3': 'is_match_emd_stamp_3',    // NEW
  }[emd_method];
  
  // Get matches for this method
  const { data: matches } = await supabase
    .from('zhe_serp_results')
    .select('result_id, rank_absolute')
    .eq(matchColumn, true)
    .in('rel_fetch_id', fetchIds);
  
  // Populate relations table with emd_method = 'method-3'
  // Populate cache table with emd_method = 'method-3'
}
```

### Step 4: Update UI to display method-3 columns
```tsx
// app/(protected)/kwjar/components/KeywordsHubTable.tsx

// Add 15 new columns for method-3
const method3Columns: ColumnDefinition[] = [
  { key: 'emd_cache_m3.total_emd_sites', label: 'Method 3 Total', ... },
  { key: 'emd_cache_m3.zone_1_count', label: 'M3 Zone 1 Count', ... },
  { key: 'emd_cache_m3.zone_1_domains', label: 'M3 Zone 1 Domains', type: 'emd_domains', ... },
  // ... 12 more columns
];
```

**That's it!** No schema changes needed, just new data.

---

## STORAGE COMPARISON: YOUR DESIGN vs HYBRID

### Your Kernel Design (7 rows per keyword per method)

For 10,000 keywords with 3 methods:
```
Rows: 10,000 × 3 methods × 7 zones = 210,000 rows
Storage per row: ~100 bytes (small, focused)
Total storage: ~20 MB + indexes ~30 MB = 50 MB
```

### Our Hybrid Design (1 row per keyword per method)

For 10,000 keywords with 3 methods:
```
Rows: 10,000 × 3 methods = 30,000 rows
Storage per row: ~2 KB (larger, contains all zones)
Total storage: ~60 MB + indexes ~20 MB = 80 MB
```

**Trade-off**: We use +30 MB more storage, but queries are 7x simpler (1 row vs 7 rows)

---

## ADDRESSING YOUR ORIGINAL "KERNEL" DESIGN

### What to Keep:
✅ **The `emd_stamp_method` concept** - We adopt this as `emd_method` column  
✅ **UNIQUE constraint on method+zone** - We use UNIQUE(keyword_id, emd_method)  
✅ **JSONB for detailed data** - We keep the domain arrays in JSONB  

### What to Adapt:
⚠️ **7 kernel rows → 1 cache row** - Store all 7 zones in one row per method  
⚠️ **Simpler relations table** - Just (result_id, zone_id, emd_method)  

### Why the Adaptation:
1. **UI query complexity**: Your design requires aggregating 7 rows per keyword per method. For 1000 keywords × 3 methods = 21,000 rows to aggregate. Our design: 3,000 rows (1 per keyword per method).

2. **JOIN count**: Your design needs 7 LEFT JOINs per method (21 JOINs for 3 methods). Our design needs 3 LEFT JOINs (1 per method).

3. **Display logic**: Your design needs complex aggregation in React. Our design: map 1 row → 1 table row.

---

## FINAL RECOMMENDATION

### Use the Hybrid Approach:

1. ✅ **Cache table**: One row per keyword per method (all 7 zones in one row)
2. ✅ **Add `emd_method` column** to both cache and relations tables
3. ✅ **UNIQUE constraint**: `(keyword_id, emd_method)` in cache
4. ✅ **Relations table**: `(result_id, zone_id, emd_method)` to track which results match which methods
5. ✅ **UI query**: 3 LEFT JOINs (one per method) to load all data

### Benefits:
- ✅ Native multi-method support
- ✅ Simple UI queries (1 row per keyword per method)
- ✅ Easy to add new methods (no schema changes)
- ✅ Fast performance (~100ms for 1000 keywords × 3 methods)
- ✅ Same result can match multiple methods independently

---

## MIGRATION PATH

### Phase 1: Current System (Method-1 Only)
- ✅ One cache row per keyword
- ✅ No `emd_method` column (implicit "method-1")

### Phase 2: Add Multi-Method Support
```sql
-- Add emd_method column with default
ALTER TABLE keywordshub_emd_zone_cache
ADD COLUMN emd_method VARCHAR(50) DEFAULT 'method-1';

-- Update UNIQUE constraint
ALTER TABLE keywordshub_emd_zone_cache
DROP CONSTRAINT IF EXISTS keywordshub_emd_zone_cache_keyword_id_key;

ALTER TABLE keywordshub_emd_zone_cache
ADD CONSTRAINT keywordshub_emd_zone_cache_keyword_method_unique
UNIQUE (keyword_id, emd_method);

-- Add emd_method to relations table
ALTER TABLE keywordshub_serp_zone_emd_matches
ADD COLUMN emd_method VARCHAR(50) DEFAULT 'method-1';
```

### Phase 3: Add Method-2
- Create `is_match_emd_stamp_2` column in zhe_serp_results
- Create F411 API route
- Update F420 to accept `emd_method` parameter
- Add UI columns for method-2

### Phase 4+: Add Method-3, Method-4, etc.
- Same pattern as Phase 3
- No schema changes needed!

---

## QUESTIONS FOR YOU

1. **How many methods do you anticipate?**
   - 2-3 methods? Hybrid approach is perfect
   - 10+ methods? Consider your kernel approach

2. **Will methods have similar or different zone definitions?**
   - Same zones (1, 2, 3, 4-10, etc.)? Hybrid works great
   - Different zones per method? Kernel approach better

3. **Do you want to compare methods side-by-side in UI?**
   - YES? Hybrid approach makes this easy (one query)
   - NO? Either approach works

4. **Storage vs query complexity preference?**
   - Prefer simpler queries? → Hybrid (+30 MB storage)
   - Prefer less storage? → Your kernel design (more complex queries)

---

**END OF PLANNING DOCUMENT 6**

Ready for your feedback on multi-method architecture! 🚀
