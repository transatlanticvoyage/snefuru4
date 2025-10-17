# RANKING ZONES SYSTEM - PLANNING DOCUMENT 5

**Status**: Planning Phase - Analyzing Redundant Columns  
**Date**: October 16, 2025  
**Purpose**: Show schema WITH potentially redundant columns for comparison

---

## OVERVIEW

This document shows the database schema **WITH all potentially redundant columns included**, so you can decide which approach you prefer:

- **Option A**: Normalized (no redundancy) - Smaller storage, requires JOINs
- **Option B**: Denormalized (with redundancy) - Faster queries, larger storage

---

## RELATIONS TABLE COMPARISON

### OPTION A: Fully Normalized (FROM DOC 4)

==========================================================
============== SEPARATOR =================================
==========================================================
```sql
CREATE TABLE keywordshub_serp_zone_emd_matches (
  match_id SERIAL PRIMARY KEY,
  keyword_id INTEGER NOT NULL,
  result_id INTEGER NOT NULL,
  zone_id INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Storage**: ~32 bytes per row

---

### OPTION B: With Redundant Columns (THIS DOCUMENT)

```sql
CREATE TABLE keywordshub_serp_zone_emd_matches (
  match_id SERIAL PRIMARY KEY,
  
  -- Core FKs
  keyword_id INTEGER NOT NULL,
  result_id INTEGER NOT NULL,
  zone_id INTEGER NOT NULL,
  
  -- POTENTIALLY REDUNDANT COLUMNS BELOW
  fetch_id INTEGER NOT NULL,              -- ⚠️ REDUNDANT: Can get via result_id → zhe_serp_results.rel_fetch_id
  zone_key VARCHAR(10) NOT NULL,          -- ⚠️ REDUNDANT: Can get via zone_id → ranking_zones.zone_key
  domain TEXT NOT NULL,                   -- ⚠️ REDUNDANT: Can get via result_id → zhe_serp_results.domain
  rank_absolute INTEGER NOT NULL,         -- ⚠️ REDUNDANT: Can get via result_id → zhe_serp_results.rank_absolute
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

**Storage**: ~80 bytes per row (2.5x larger due to TEXT field)

---

## EXAMPLE DATA WITH ALL COLUMNS

### TABLE: `keywordshub_serp_zone_emd_matches` (Option B - WITH Redundant Columns)

**For keyword_id 1832 ("pest control baton rouge") - 5 EMD matches**

| match_id | keyword_id | result_id | zone_id | fetch_id<br/>⚠️ REDUNDANT | zone_key<br/>⚠️ REDUNDANT | domain<br/>⚠️ REDUNDANT | rank_absolute<br/>⚠️ REDUNDANT | created_at |
|----------|------------|-----------|---------|---------------------------|---------------------------|-------------------------|-------------------------------|------------|
| 10001 | 1832 | 4854 | 1 | **57** | **1** | **pestcontrol-batonrouge.com** | **1** | 2025-10-16 14:35:22 |
| 10002 | 1832 | 4856 | 3 | **57** | **3** | **batonrougepest.com** | **3** | 2025-10-16 14:35:22 |
| 10003 | 1832 | 4861 | 4 | **57** | **4_10** | **pestservicesbatonrouge.com** | **7** | 2025-10-16 14:35:22 |
| 10004 | 1832 | 4863 | 4 | **57** | **4_10** | **batonrouge-pestcontrol.com** | **9** | 2025-10-16 14:35:22 |
| 10005 | 1832 | 4872 | 5 | **57** | **11_25** | **batonrougepestcontrol.com** | **18** | 2025-10-16 14:35:22 |

**For keyword_id 1813 ("pest control pittsburgh") - 4 EMD matches**

| match_id | keyword_id | result_id | zone_id | fetch_id<br/>⚠️ REDUNDANT | zone_key<br/>⚠️ REDUNDANT | domain<br/>⚠️ REDUNDANT | rank_absolute<br/>⚠️ REDUNDANT | created_at |
|----------|------------|-----------|---------|---------------------------|---------------------------|-------------------------|-------------------------------|------------|
| 10101 | 1813 | 3747 | 2 | **43** | **2** | **pestpatrolpittsburgh.com** | **2** | 2025-10-16 14:40:12 |
| 10102 | 1813 | 3797 | 4 | **43** | **4_10** | **excellentpestguysofpittsburgh.com** | **8** | 2025-10-16 14:40:12 |
| 10103 | 1813 | 4917 | 5 | **46** | **11_25** | **pestpatrolpittsburgh.com** | **14** | 2025-10-16 14:40:12 |
| 10104 | 1813 | 4972 | 5 | **58** | **11_25** | **excellentpestguysofpittsburgh.com** | **19** | 2025-10-16 14:40:12 |

---

## DETAILED REDUNDANCY ANALYSIS

### Column 1: `fetch_id` ⚠️ POTENTIALLY REDUNDANT

#### How to get without storing:
```sql
SELECT 
  kszem.*,
  zsr.rel_fetch_id as fetch_id  -- Get from zhe_serp_results
FROM keywordshub_serp_zone_emd_matches kszem
JOIN zhe_serp_results zsr ON zsr.result_id = kszem.result_id;
```

#### Pros of STORING:
- ✅ No JOIN needed to filter by fetch
- ✅ Historical queries easier: "Show EMD matches from fetch 57"
- ✅ Can query by fetch_id directly with index

#### Cons of STORING:
- ❌ +4 bytes per row
- ❌ Redundant data (same as zhe_serp_results.rel_fetch_id)
- ❌ Could become stale if zhe_serp_results updated
- ❌ Extra index needed if want fast fetch lookups

#### Usage Frequency:
- **RARE**: Most queries are "show EMD matches for keyword X"
- **RARE**: Occasionally "show EMD matches from fetch Y"
- **Verdict**: Probably not worth storing

---

### Column 2: `zone_key` ⚠️ POTENTIALLY REDUNDANT

#### How to get without storing:
```sql
SELECT 
  kszem.*,
  rz.zone_key  -- Get from ranking_zones
FROM keywordshub_serp_zone_emd_matches kszem
JOIN ranking_zones rz ON rz.zone_id = kszem.zone_id;
```

#### Pros of STORING:
- ✅ No JOIN needed to filter by zone_key
- ✅ Human-readable zone identifier in table
- ✅ Useful for quick queries: "WHERE zone_key = '4_10'"

#### Cons of STORING:
- ❌ +10 bytes per row (VARCHAR(10))
- ❌ Redundant data (same as ranking_zones.zone_key)
- ❌ ranking_zones is small (7 rows), JOIN is trivial

#### Usage Frequency:
- **MEDIUM**: Queries often filter by zone: "Show EMD matches in zone 4-10"
- **But**: zone_id works just as well, and ranking_zones JOIN is super fast
- **Verdict**: Slight convenience, but not necessary

---

### Column 3: `domain` ⚠️ POTENTIALLY REDUNDANT

#### How to get without storing:
```sql
SELECT 
  kszem.*,
  zsr.domain  -- Get from zhe_serp_results
FROM keywordshub_serp_zone_emd_matches kszem
JOIN zhe_serp_results zsr ON zsr.result_id = kszem.result_id;
```

#### Pros of STORING:
- ✅ No JOIN needed to display domains
- ✅ Useful for quick text searches: "WHERE domain LIKE '%pest%'"
- ✅ Faster queries if often displaying domain

#### Cons of STORING:
- ❌ +20-50 bytes per row (TEXT field, varies by domain length)
- ❌ **BIGGEST storage impact** of all redundant columns
- ❌ Redundant data (same as zhe_serp_results.domain)
- ❌ Could become stale if domain corrected in zhe_serp_results

#### Usage Frequency:
- **HIGH**: Most queries will display domain (it's the whole point!)
- **But**: We're caching domains in keywordshub_emd_zone_cache anyway
- **Verdict**: Cache has domains, so not needed in relations table

---

### Column 4: `rank_absolute` ⚠️ POTENTIALLY REDUNDANT

#### How to get without storing:
```sql
SELECT 
  kszem.*,
  zsr.rank_absolute  -- Get from zhe_serp_results
FROM keywordshub_serp_zone_emd_matches kszem
JOIN zhe_serp_results zsr ON zsr.result_id = kszem.result_id;
```

#### Pros of STORING:
- ✅ No JOIN needed to filter/sort by rank
- ✅ Useful for "ORDER BY rank_absolute" queries
- ✅ Can filter: "WHERE rank_absolute <= 10"

#### Cons of STORING:
- ❌ +4 bytes per row
- ❌ Redundant data (same as zhe_serp_results.rank_absolute)
- ❌ zone_id already implies rank range (zone 1 = rank 1, etc.)

#### Usage Frequency:
- **MEDIUM**: Often want to see exact rank, not just zone
- **But**: We're caching rank in JSONB anyway (in cache table)
- **Verdict**: Nice to have, but zone_id covers most use cases

---

## STORAGE COMPARISON (10,000 keywords, avg 5 EMD matches each)

| Component | Option A (Normalized) | Option B (With Redundant) | Difference |
|-----------|----------------------|---------------------------|------------|
| Rows | 50,000 | 50,000 | Same |
| Bytes per row | ~32 bytes | ~80 bytes | +150% |
| Total raw data | ~1.5 MB | ~3.8 MB | +2.3 MB |
| With indexes | ~3 MB | ~8 MB | +5 MB |

**Analysis**: Redundant columns add **~5 MB** for 10K keywords. Not huge, but significant.

---

## QUERY PERFORMANCE COMPARISON

### Query 1: Get all EMD matches for a keyword

**Option A (Normalized)**:
```sql
-- Need JOINs to get full data
SELECT 
  kszem.match_id,
  kszem.keyword_id,
  zsr.domain,
  zsr.rank_absolute,
  rz.zone_key
FROM keywordshub_serp_zone_emd_matches kszem
JOIN zhe_serp_results zsr ON zsr.result_id = kszem.result_id
JOIN ranking_zones rz ON rz.zone_id = kszem.zone_id
WHERE kszem.keyword_id = 1832;
```
**Performance**: ~5-10ms (2 JOINs on indexed FKs)

**Option B (Denormalized)**:
```sql
-- All data in one table
SELECT * FROM keywordshub_serp_zone_emd_matches
WHERE keyword_id = 1832;
```
**Performance**: ~2-3ms (direct lookup, no JOINs)

**Winner**: Option B is ~2x faster, but both are very fast

---

### Query 2: Filter by zone

**Option A (Normalized)**:
```sql
-- Can use zone_id directly
SELECT * FROM keywordshub_serp_zone_emd_matches
WHERE keyword_id = 1832 AND zone_id = 4;  -- zone_id for 4-10
```
**Performance**: ~2-3ms (indexed zone_id)

**Option B (Denormalized)**:
```sql
-- Can use zone_key (more readable)
SELECT * FROM keywordshub_serp_zone_emd_matches
WHERE keyword_id = 1832 AND zone_key = '4_10';
```
**Performance**: ~2-3ms (indexed zone_key)

**Winner**: Tie (both fast, Option B slightly more readable)

---

### Query 3: Search by domain

**Option A (Normalized)**:
```sql
-- Need JOIN to search domain
SELECT kszem.* FROM keywordshub_serp_zone_emd_matches kszem
JOIN zhe_serp_results zsr ON zsr.result_id = kszem.result_id
WHERE kszem.keyword_id = 1832 AND zsr.domain LIKE '%pest%';
```
**Performance**: ~10-15ms (JOIN + text search)

**Option B (Denormalized)**:
```sql
-- Direct text search
SELECT * FROM keywordshub_serp_zone_emd_matches
WHERE keyword_id = 1832 AND domain LIKE '%pest%';
```
**Performance**: ~5-8ms (direct text search, no JOIN)

**Winner**: Option B is 2x faster for text searches

---

### Query 4: Get EMD matches from specific fetch

**Option A (Normalized)**:
```sql
-- Need JOIN to filter by fetch
SELECT kszem.* FROM keywordshub_serp_zone_emd_matches kszem
JOIN zhe_serp_results zsr ON zsr.result_id = kszem.result_id
WHERE zsr.rel_fetch_id = 57;
```
**Performance**: ~10-15ms (JOIN on large table)

**Option B (Denormalized)**:
```sql
-- Direct lookup with fetch_id
SELECT * FROM keywordshub_serp_zone_emd_matches
WHERE fetch_id = 57;
```
**Performance**: ~2-3ms (indexed fetch_id)

**Winner**: Option B is **5x faster** for fetch queries

---

## RECOMMENDATION MATRIX

| Column | Store It? | Reasoning |
|--------|-----------|-----------|
| **keyword_id** | ✅ **YES** | Essential for most queries. Worth the storage. |
| **result_id** | ✅ **YES** | Essential FK. Links to full SERP data. |
| **zone_id** | ✅ **YES** | Essential FK. Defines which zone. |
| **fetch_id** | ⚠️ **MAYBE** | Useful for historical queries, but rare. Can get via JOIN. **Lean NO** |
| **zone_key** | ⚠️ **MAYBE** | More readable than zone_id, but ranking_zones JOIN is trivial. **Lean NO** |
| **domain** | ❌ **NO** | Already cached in keywordshub_emd_zone_cache. Largest storage impact. **SKIP** |
| **rank_absolute** | ⚠️ **MAYBE** | Already cached in keywordshub_emd_zone_cache. Useful for sorting. **Lean NO** |

---

## RECOMMENDED APPROACH: "OPTION A PLUS"

### Keep it mostly normalized, but add `zone_key` for convenience:

```sql
CREATE TABLE keywordshub_serp_zone_emd_matches (
  match_id SERIAL PRIMARY KEY,
  
  -- Core relationships (essential)
  keyword_id INTEGER NOT NULL,
  result_id INTEGER NOT NULL,
  zone_id INTEGER NOT NULL,
  
  -- Add ONLY zone_key for convenience
  zone_key VARCHAR(10) NOT NULL,  -- Slightly redundant but useful for readable queries
  
  created_at TIMESTAMP DEFAULT NOW()
);
```

### Why this middle ground?

1. ✅ **Keeps storage small** (~40 bytes per row instead of 80)
2. ✅ **zone_key is human-readable** (easier to write queries)
3. ✅ **zone_key is small** (only +10 bytes, not +50 like domain)
4. ✅ **Still normalized** for domain/rank (get via JOIN when needed)
5. ✅ **Cache table has domains** anyway (for UI display)

---

## EXAMPLE DATA - RECOMMENDED APPROACH

**For keyword_id 1832 ("pest control baton rouge")**

| match_id | keyword_id | result_id | zone_id | zone_key | created_at |
|----------|------------|-----------|---------|----------|------------|
| 10001 | 1832 | 4854 | 1 | 1 | 2025-10-16 14:35:22 |
| 10002 | 1832 | 4856 | 3 | 3 | 2025-10-16 14:35:22 |
| 10003 | 1832 | 4861 | 4 | 4_10 | 2025-10-16 14:35:22 |
| 10004 | 1832 | 4863 | 4 | 4_10 | 2025-10-16 14:35:22 |
| 10005 | 1832 | 4872 | 5 | 11_25 | 2025-10-16 14:35:22 |

**To get full details with domain and rank:**

```sql
SELECT 
  kszem.match_id,
  kszem.keyword_id,
  kszem.zone_key,      -- Stored for convenience
  zsr.domain,          -- From JOIN
  zsr.rank_absolute,   -- From JOIN
  zsr.url              -- From JOIN
FROM keywordshub_serp_zone_emd_matches kszem
JOIN zhe_serp_results zsr ON zsr.result_id = kszem.result_id
WHERE kszem.keyword_id = 1832
ORDER BY zsr.rank_absolute;
```

---

## SUMMARY: THREE OPTIONS

### Option A: Fully Normalized (Doc 4)
```
Columns: keyword_id, result_id, zone_id
Storage: ~3 MB for 10K keywords
Queries: Requires JOINs for domain/rank
Speed: 5-10ms with JOINs
```

### Option B: Denormalized (This Doc)
```
Columns: keyword_id, result_id, zone_id, fetch_id, zone_key, domain, rank_absolute
Storage: ~8 MB for 10K keywords
Queries: No JOINs needed
Speed: 2-3ms, no JOINs
```

### Option A-Plus: Middle Ground (RECOMMENDED)
```
Columns: keyword_id, result_id, zone_id, zone_key
Storage: ~4 MB for 10K keywords
Queries: One JOIN for domain/rank when needed
Speed: 3-5ms with one JOIN
Benefit: Readable queries, small storage impact
```

---

## YOUR DECISION POINTS

### Question 1: Do you query by `fetch_id` often?
- **If YES** → Store it (adds 4 bytes per row)
- **If NO** → Skip it, get via JOIN when needed

### Question 2: Do you prefer readable `zone_key` over numeric `zone_id`?
- **If YES** → Store zone_key (adds 10 bytes per row)
- **If NO** → Use zone_id only, JOIN to get zone_key

### Question 3: Do you need `domain` in relations table?
- **Consider**: Cache table already has domains for UI display
- **Consider**: domain is largest field (+50 bytes per row)
- **Recommendation**: Skip it, get via JOIN for drill-down queries

### Question 4: Do you need `rank_absolute` in relations table?
- **Consider**: Cache table already has rank in JSONB
- **Consider**: zone_id implies rank range
- **Recommendation**: Skip it, get via JOIN when need exact rank

---

## NEXT STEPS

1. **Review this document** and decide which columns to include
2. **Tell me your preference**:
   - Option A (Fully Normalized)
   - Option B (All Redundant Columns)
   - Option A-Plus (Just zone_key)
   - Custom mix (specify which columns)
3. **I'll create final SQL** based on your decision
4. **Proceed to implementation**

---

**END OF PLANNING DOCUMENT 5**

Ready for your feedback! 🎯
