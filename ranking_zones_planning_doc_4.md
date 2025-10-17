# RANKING ZONES SYSTEM - PLANNING DOCUMENT 4

**Status**: Planning Phase - Awaiting Approval  
**Date**: October 16, 2025  
**Architecture**: EMD Matches Only (95% storage reduction)

---

## EXECUTIVE SUMMARY

### What We're Building
A system to display EMD match counts and domains per ranking zone on the `/kwjar` page.

### Key Optimization
**Store ONLY EMD matches** (not all 98 SERP results per keyword)
- **Before**: 980,000 rows for 10K keywords
- **After**: 50,000 rows for 10K keywords  
- **Savings**: 95% storage reduction

### UI Goal
Two column sets in the `/kwjar` table:
1. **Count columns**: Show # of EMD matches per zone
2. **Domain columns**: Show actual EMD domains per zone

---

## DATABASE TABLES (3 NEW TABLES)

### TABLE 1: `ranking_zones` (Reference Table)

**Purpose**: Defines the 7 ranking zones

#### Schema
```sql
CREATE TABLE ranking_zones (
  zone_id SERIAL PRIMARY KEY,
  zone_key VARCHAR(10) NOT NULL UNIQUE,
  zone_name VARCHAR(50) NOT NULL,
  min_rank INTEGER NOT NULL,
  max_rank INTEGER NOT NULL,
  display_order INTEGER NOT NULL,
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Complete Data (7 rows, pre-populated)

| zone_id | zone_key | zone_name          | min_rank | max_rank | display_order | created_at          |
|---------|----------|--------------------|----------|----------|---------------|---------------------|
| 1       | 1        | Position 1         | 1        | 1        | 1             | 2025-10-16 14:32:15 |
| 2       | 2        | Position 2         | 2        | 2        | 2             | 2025-10-16 14:32:15 |
| 3       | 3        | Position 3         | 3        | 3        | 3             | 2025-10-16 14:32:15 |
| 4       | 4_10     | Positions 4-10     | 4        | 10       | 4             | 2025-10-16 14:32:15 |
| 5       | 11_25    | Positions 11-25    | 11       | 25       | 5             | 2025-10-16 14:32:15 |
| 6       | 26_50    | Positions 26-50    | 26       | 50       | 6             | 2025-10-16 14:32:15 |
| 7       | 51_100   | Positions 51-100   | 51       | 100      | 7             | 2025-10-16 14:32:15 |

**Notes**:
- Static reference data
- Used to determine which zone a SERP result belongs to
- `zone_key` used in cache column names (e.g., `zone_4_10_count`)

---

### TABLE 2: `keywordshub_serp_zone_emd_matches` (Relations Table)

**Purpose**: Stores granular EMD match relationships (ONLY EMD matches, not all SERP results)

#### Schema
```sql
CREATE TABLE keywordshub_serp_zone_emd_matches (
  match_id SERIAL PRIMARY KEY,
  keyword_id INTEGER NOT NULL REFERENCES keywordshub(keyword_id),
  result_id INTEGER NOT NULL REFERENCES zhe_serp_results(result_id),
  zone_id INTEGER NOT NULL REFERENCES ranking_zones(zone_id),
  created_at TIMESTAMP DEFAULT NOW()
);
```

#### Example Data for keyword_id 1832 ("pest control baton rouge")

**Scenario**: Keyword has 98 total SERP results, but only 5 are EMD matches

| match_id | keyword_id | result_id | zone_id | created_at          | Notes                                                    |
|----------|------------|-----------|---------|---------------------|----------------------------------------------------------|
| 10001    | 1832       | 4854      | 1       | 2025-10-16 14:35:22 | EMD match at rank 1 (zone 1)                             |
| 10002    | 1832       | 4856      | 3       | 2025-10-16 14:35:22 | EMD match at rank 3 (zone 3)                             |
| 10003    | 1832       | 4861      | 4       | 2025-10-16 14:35:22 | EMD match at rank 7 (zone 4_10)                          |
| 10004    | 1832       | 4863      | 4       | 2025-10-16 14:35:22 | EMD match at rank 9 (zone 4_10)                          |
| 10005    | 1832       | 4872      | 5       | 2025-10-16 14:35:22 | EMD match at rank 18 (zone 11_25)                        |

**Key Points**:
- **Only 5 rows** stored (not 98!)
- All 5 rows represent EMD matches (no `is_emd_match` column needed)
- Can JOIN to `zhe_serp_results` to get domain, rank, URL, etc.
- Can JOIN to `ranking_zones` to get zone_key, zone_name

#### Example Data for keyword_id 1813 ("pest control pittsburgh")

**Scenario**: Keyword has 196 total SERP results (multiple fetches), 4 are EMD matches

| match_id | keyword_id | result_id | zone_id | created_at          | Notes                                                    |
|----------|------------|-----------|---------|---------------------|----------------------------------------------------------|
| 10101    | 1813       | 3747      | 2       | 2025-10-16 14:40:12 | EMD match at rank 2 (zone 2)                             |
| 10102    | 1813       | 3797      | 4       | 2025-10-16 14:40:12 | EMD match at rank 8 (zone 4_10)                          |
| 10103    | 1813       | 4917      | 5       | 2025-10-16 14:40:12 | EMD match at rank 14 (zone 11_25)                        |
| 10104    | 1813       | 4972      | 5       | 2025-10-16 14:40:12 | EMD match at rank 19 (zone 11_25)                        |

#### Full Data Set Projection (10,000 keywords)

```
Total rows: ~50,000
- Average: 5 EMD matches per keyword
- Range: 0-15 EMD matches per keyword
- Storage: ~1.5 MB (raw data) + ~1.5 MB (indexes) = ~3 MB total
```

---

### TABLE 3: `keywordshub_emd_zone_cache` (Cache Table)

**Purpose**: Fast aggregated cache for UI display (dual column sets)

#### Schema
```sql
CREATE TABLE keywordshub_emd_zone_cache (
  keyword_id INTEGER PRIMARY KEY REFERENCES keywordshub(keyword_id),
  latest_fetch_id INTEGER REFERENCES zhe_serp_fetches(fetch_id),
  
  -- SET 1: COUNT COLUMNS (8 columns)
  total_emd_sites INTEGER DEFAULT 0,
  zone_1_count INTEGER DEFAULT 0,
  zone_2_count INTEGER DEFAULT 0,
  zone_3_count INTEGER DEFAULT 0,
  zone_4_10_count INTEGER DEFAULT 0,
  zone_11_25_count INTEGER DEFAULT 0,
  zone_26_50_count INTEGER DEFAULT 0,
  zone_51_100_count INTEGER DEFAULT 0,
  
  -- SET 2: DOMAIN COLUMNS (7 columns)
  zone_1_domains JSONB,
  zone_2_domains JSONB,
  zone_3_domains JSONB,
  zone_4_10_domains JSONB,
  zone_11_25_domains JSONB,
  zone_26_50_domains JSONB,
  zone_51_100_domains JSONB,
  
  cached_at TIMESTAMP DEFAULT NOW(),
  cache_version INTEGER DEFAULT 1
);
```

#### Example Row 1: keyword_id 1832 ("pest control baton rouge")

| Column                  | Value                                                                                                                                                          | Type      |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| **keyword_id**          | 1832                                                                                                                                                           | INTEGER   |
| **latest_fetch_id**     | 57                                                                                                                                                             | INTEGER   |
| **— COUNT COLUMNS —**   |                                                                                                                                                                |           |
| **total_emd_sites**     | 5                                                                                                                                                              | INTEGER   |
| **zone_1_count**        | 1                                                                                                                                                              | INTEGER   |
| **zone_2_count**        | 0                                                                                                                                                              | INTEGER   |
| **zone_3_count**        | 1                                                                                                                                                              | INTEGER   |
| **zone_4_10_count**     | 2                                                                                                                                                              | INTEGER   |
| **zone_11_25_count**    | 1                                                                                                                                                              | INTEGER   |
| **zone_26_50_count**    | 0                                                                                                                                                              | INTEGER   |
| **zone_51_100_count**   | 0                                                                                                                                                              | INTEGER   |
| **— DOMAIN COLUMNS —**  |                                                                                                                                                                |           |
| **zone_1_domains**      | `[{"domain": "pestcontrol-batonrouge.com", "rank": 1, "result_id": 4854}]`                                                                                    | JSONB     |
| **zone_2_domains**      | `[]`                                                                                                                                                           | JSONB     |
| **zone_3_domains**      | `[{"domain": "batonrougepest.com", "rank": 3, "result_id": 4856}]`                                                                                            | JSONB     |
| **zone_4_10_domains**   | `[{"domain": "pestservicesbatonrouge.com", "rank": 7, "result_id": 4861}, {"domain": "batonrouge-pestcontrol.com", "rank": 9, "result_id": 4863}]`           | JSONB     |
| **zone_11_25_domains**  | `[{"domain": "batonrougepestcontrol.com", "rank": 18, "result_id": 4872}]`                                                                                    | JSONB     |
| **zone_26_50_domains**  | `[]`                                                                                                                                                           | JSONB     |
| **zone_51_100_domains** | `[]`                                                                                                                                                           | JSONB     |
| **cached_at**           | 2025-10-16 14:35:25                                                                                                                                            | TIMESTAMP |
| **cache_version**       | 1                                                                                                                                                              | INTEGER   |

#### Example Row 2: keyword_id 1813 ("pest control pittsburgh")

| Column                  | Value                                                                                                                                                          | Type      |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| **keyword_id**          | 1813                                                                                                                                                           | INTEGER   |
| **latest_fetch_id**     | 58                                                                                                                                                             | INTEGER   |
| **— COUNT COLUMNS —**   |                                                                                                                                                                |           |
| **total_emd_sites**     | 4                                                                                                                                                              | INTEGER   |
| **zone_1_count**        | 0                                                                                                                                                              | INTEGER   |
| **zone_2_count**        | 1                                                                                                                                                              | INTEGER   |
| **zone_3_count**        | 0                                                                                                                                                              | INTEGER   |
| **zone_4_10_count**     | 1                                                                                                                                                              | INTEGER   |
| **zone_11_25_count**    | 2                                                                                                                                                              | INTEGER   |
| **zone_26_50_count**    | 0                                                                                                                                                              | INTEGER   |
| **zone_51_100_count**   | 0                                                                                                                                                              | INTEGER   |
| **— DOMAIN COLUMNS —**  |                                                                                                                                                                |           |
| **zone_1_domains**      | `[]`                                                                                                                                                           | JSONB     |
| **zone_2_domains**      | `[{"domain": "pestpatrolpittsburgh.com", "rank": 2, "result_id": 3747}]`                                                                                      | JSONB     |
| **zone_3_domains**      | `[]`                                                                                                                                                           | JSONB     |
| **zone_4_10_domains**   | `[{"domain": "excellentpestguysofpittsburgh.com", "rank": 8, "result_id": 3797}]`                                                                             | JSONB     |
| **zone_11_25_domains**  | `[{"domain": "pestpatrolpittsburgh.com", "rank": 14, "result_id": 4917}, {"domain": "excellentpestguysofpittsburgh.com", "rank": 19, "result_id": 4972}]`    | JSONB     |
| **zone_26_50_domains**  | `[]`                                                                                                                                                           | JSONB     |
| **zone_51_100_domains** | `[]`                                                                                                                                                           | JSONB     |
| **cached_at**           | 2025-10-16 14:40:15                                                                                                                                            | TIMESTAMP |
| **cache_version**       | 1                                                                                                                                                              | INTEGER   |

#### Example Row 3: keyword_id 1820 ("pest control buffalo" - Many EMD matches)

| Column                  | Value                                                                                                                                                                                      | Type      |
|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|
| **keyword_id**          | 1820                                                                                                                                                                                        | INTEGER   |
| **latest_fetch_id**     | 57                                                                                                                                                                                          | INTEGER   |
| **— COUNT COLUMNS —**   |                                                                                                                                                                                             |           |
| **total_emd_sites**     | 9                                                                                                                                                                                           | INTEGER   |
| **zone_1_count**        | 1                                                                                                                                                                                           | INTEGER   |
| **zone_2_count**        | 0                                                                                                                                                                                           | INTEGER   |
| **zone_3_count**        | 1                                                                                                                                                                                           | INTEGER   |
| **zone_4_10_count**     | 3                                                                                                                                                                                           | INTEGER   |
| **zone_11_25_count**    | 2                                                                                                                                                                                           | INTEGER   |
| **zone_26_50_count**    | 1                                                                                                                                                                                           | INTEGER   |
| **zone_51_100_count**   | 1                                                                                                                                                                                           | INTEGER   |
| **— DOMAIN COLUMNS —**  |                                                                                                                                                                                             |           |
| **zone_1_domains**      | `[{"domain": "buffalopestcontrol.com", "rank": 1, "result_id": 5201}]`                                                                                                                     | JSONB     |
| **zone_2_domains**      | `[]`                                                                                                                                                                                        | JSONB     |
| **zone_3_domains**      | `[{"domain": "pestcontrol-buffalo.com", "rank": 3, "result_id": 5203}]`                                                                                                                    | JSONB     |
| **zone_4_10_domains**   | `[{"domain": "buffalony-pestcontrol.com", "rank": 4, "result_id": 5204}, {"domain": "pestservicesbuffalo.com", "rank": 6, "result_id": 5206}, {"domain": "buffalopest.com", "rank": 9, "result_id": 5209}]` | JSONB |
| **zone_11_25_domains**  | `[{"domain": "pestcontrolbuffalony.com", "rank": 14, "result_id": 5214}, {"domain": "buffalo-pestservices.com", "rank": 21, "result_id": 5221}]`                                          | JSONB     |
| **zone_26_50_domains**  | `[{"domain": "pestguardiansbuffalo.com", "rank": 33, "result_id": 5233}]`                                                                                                                  | JSONB     |
| **zone_51_100_domains** | `[{"domain": "buffalony-pestexperts.com", "rank": 67, "result_id": 5267}]`                                                                                                                 | JSONB     |
| **cached_at**           | 2025-10-16 15:22:18                                                                                                                                                                         | TIMESTAMP |
| **cache_version**       | 1                                                                                                                                                                                           | INTEGER   |

#### Full Data Set Projection (10,000 keywords)

```
Total rows: 10,000 (one per keyword)
Storage: ~20 MB (with JSONB data) + ~5 MB (indexes) = ~25 MB total
```

---

## EXISTING TABLES (NO MODIFICATIONS NEEDED)

### ✅ No changes to existing tables!

All existing tables already have the columns we need:

| Table                | Columns We Use                                      | Status |
|----------------------|-----------------------------------------------------|--------|
| `keywordshub`        | `keyword_id`, `rel_industry_id`, `cached_city_name` | ✅ Ready |
| `zhe_serp_fetches`   | `fetch_id`, `rel_keyword_id`, `created_at`          | ✅ Ready |
| `zhe_serp_results`   | `result_id`, `rel_fetch_id`, `domain`, `rank_absolute`, `is_match_emd_stamp`, `url`, `title` | ✅ Ready |
| `industries`         | `industry_id`, `emd_stamp_slug`                     | ✅ Ready |

---

## UI TABLE DISPLAY ON /KWJAR

### Column Layout

```
┌────────────────┬───────────────────────────────────────┬────────────────────────────────────────────────────────┐
│                │       COUNT COLUMNS (SET 1)           │              DOMAIN COLUMNS (SET 2)                    │
│  Keyword Info  ├──────┬────┬────┬────┬──────┬──────┬───┼────────┬─────┬─────┬─────┬──────┬──────┬──────┬──────┤
│                │total │ 1  │ 2  │ 3  │ 4-10 │11-25 │...│domains │  1  │  2  │  3  │ 4-10 │11-25 │26-50 │51-100│
├────────────────┼──────┼────┼────┼────┼──────┼──────┼───┼────────┼─────┼─────┼─────┼──────┼──────┼──────┼──────┤
│pest control    │  5   │ 1  │ 0  │ 1  │  2   │  1   │ 0 │  list  │ emd1│  -  │ emd2│ emd3 │ emd4 │  -   │  -   │
│baton rouge     │      │    │    │    │      │      │   │        │     │     │     │ emd5 │      │      │      │
├────────────────┼──────┼────┼────┼────┼──────┼──────┼───┼────────┼─────┼─────┼─────┼──────┼──────┼──────┼──────┤
│pest control    │  4   │ 0  │ 1  │ 0  │  1   │  2   │ 0 │  list  │  -  │ emd1│  -  │ emd2 │ emd3 │  -   │  -   │
│pittsburgh      │      │    │    │    │      │      │   │        │     │     │     │      │ emd4 │      │      │
├────────────────┼──────┼────┼────┼────┼──────┼──────┼───┼────────┼─────┼─────┼─────┼──────┼──────┼──────┼──────┤
│pest control    │  9   │ 1  │ 0  │ 1  │  3   │  2   │ 1 │  list  │ emd1│  -  │ emd2│ emd3 │ emd5 │ emd7 │ emd9 │
│buffalo         │      │    │    │    │      │      │   │        │     │     │     │ emd4 │ emd6 │      │      │
│                │      │    │    │    │      │      │   │        │     │     │     │ emd5 │      │      │      │
└────────────────┴──────┴────┴────┴────┴──────┴──────┴───┴────────┴─────┴─────┴─────┴──────┴──────┴──────┴──────┘
```

### Single Query to Load All Data

```sql
SELECT 
  k.keyword_id,
  k.keyword_datum,
  c.total_emd_sites,
  c.zone_1_count,
  c.zone_2_count,
  c.zone_3_count,
  c.zone_4_10_count,
  c.zone_11_25_count,
  c.zone_26_50_count,
  c.zone_51_100_count,
  c.zone_1_domains,
  c.zone_2_domains,
  c.zone_3_domains,
  c.zone_4_10_domains,
  c.zone_11_25_domains,
  c.zone_26_50_domains,
  c.zone_51_100_domains
FROM keywordshub k
LEFT JOIN keywordshub_emd_zone_cache c ON c.keyword_id = k.keyword_id
WHERE k.keyword_tag_id = 17  -- Example filter
ORDER BY k.keyword_id;
```

**Performance**: ~50ms for 1000 keywords

---

## DATA FLOW

### Complete Flow from F400 → F410 → F420 → UI

```
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 1: F400 (SERP Fetch)                                                   │
├──────────────────────────────────────────────────────────────────────────────┤
│ User clicks Gazelle for keyword_id 1832                                     │
│ F400 fetches SERP results from DataForSEO                                   │
│ Creates:                                                                     │
│   - fetch_id 57 in zhe_serp_fetches                                         │
│   - result_ids 4854-4951 (98 rows) in zhe_serp_results                     │
│   - All rows have is_match_emd_stamp = FALSE initially                      │
└──────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 2: F410 (EMD Stamp Match)                                              │
├──────────────────────────────────────────────────────────────────────────────┤
│ F410 runs automatically after F400                                          │
│ Logic:                                                                       │
│   - Get emd_stamp_slug from industries table via keyword.rel_industry_id    │
│   - Get cached_city_name from keywordshub                                   │
│   - Scan all 98 zhe_serp_results for matches                               │
│   - Update is_match_emd_stamp = TRUE for 5 matching results                │
│                                                                              │
│ Result:                                                                      │
│   - 5 rows now have is_match_emd_stamp = TRUE                              │
│   - 93 rows remain is_match_emd_stamp = FALSE                              │
└──────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 3: F420 (Zone Analysis & Cache Build)                                  │
├──────────────────────────────────────────────────────────────────────────────┤
│ F420 runs automatically after F410                                          │
│                                                                              │
│ Part A: Populate keywordshub_serp_zone_emd_matches                          │
│   - Query zhe_serp_results WHERE is_match_emd_stamp = TRUE                 │
│   - Get 5 EMD matches                                                       │
│   - For each match:                                                          │
│       * Determine zone_id from rank_absolute                                │
│       * INSERT INTO keywordshub_serp_zone_emd_matches                       │
│   - Result: 5 new rows (match_ids 10001-10005)                             │
│                                                                              │
│ Part B: Populate keywordshub_emd_zone_cache                                 │
│   - Aggregate the 5 matches by zone                                         │
│   - Count matches per zone:                                                  │
│       zone_1_count = 1, zone_3_count = 1, zone_4_10_count = 2,             │
│       zone_11_25_count = 1, others = 0                                      │
│   - Build JSONB arrays with top 5 domains per zone                          │
│   - UPSERT INTO keywordshub_emd_zone_cache                                  │
│   - Result: 1 cache row with all aggregated data                            │
└──────────────────────────────────────────────────────────────────────────────┘
                                      ↓
┌──────────────────────────────────────────────────────────────────────────────┐
│ STEP 4: UI Display (/kwjar page loads)                                      │
├──────────────────────────────────────────────────────────────────────────────┤
│ User navigates to /kwjar?kwtag=17                                           │
│ UI queries:                                                                  │
│   SELECT k.*, c.* FROM keywordshub k                                        │
│   LEFT JOIN keywordshub_emd_zone_cache c ON c.keyword_id = k.keyword_id    │
│   WHERE k.keyword_tag_id = 17                                               │
│                                                                              │
│ Displays:                                                                    │
│   COUNT COLUMNS: 5, 1, 0, 1, 2, 1, 0, 0                                     │
│   DOMAIN COLUMNS: Arrays with EMD domains per zone                          │
│                                                                              │
│ Performance: ~50ms query time                                                │
└──────────────────────────────────────────────────────────────────────────────┘
```

---

## STORAGE & PERFORMANCE ANALYSIS

### Storage Breakdown (10,000 keywords)

| Component                           | Old Approach | New Approach | Savings |
|-------------------------------------|--------------|--------------|---------|
| Relations table rows                | 980,000      | 50,000       | 95%     |
| Relations table size (with indexes) | ~60 MB       | ~3 MB        | 95%     |
| Cache table size                    | ~25 MB       | ~25 MB       | 0%      |
| **Total system storage**            | **~85 MB**   | **~28 MB**   | **67%** |

### Query Performance

| Operation                              | Time (ms) | Notes                           |
|----------------------------------------|-----------|---------------------------------|
| Load /kwjar page (1000 keywords)       | ~50       | Single JOIN to cache table      |
| Get EMD matches for one keyword        | ~2-5      | Direct lookup, small dataset    |
| Drill-down to zone details             | ~10-20    | One JOIN to get full SERP data  |
| F420 processing (one keyword)          | ~100-200  | Aggregate 5 matches into cache  |
| Bulk Gazelle (10 keywords)             | ~5-10 min | F400 + F410 + F420 per keyword  |

### Scalability

| Metric                    | 1,000 keywords | 10,000 keywords | 100,000 keywords |
|---------------------------|----------------|-----------------|------------------|
| Relations table rows      | 5,000          | 50,000          | 500,000          |
| Relations table size      | ~300 KB        | ~3 MB           | ~30 MB           |
| Cache table size          | ~2.5 MB        | ~25 MB          | ~250 MB          |
| Total storage             | ~3 MB          | ~28 MB          | ~280 MB          |
| Page load time (100 rows) | ~15ms          | ~20ms           | ~30ms            |

---

## COMPARISON: OLD VS NEW ARCHITECTURE

### What We're NOT Storing (Old Approach)

```
For keyword_id 1832 with 98 SERP results:
❌ 93 rows for NON-EMD matches (wasted storage)
❌ is_emd_match boolean column (not needed if we only store matches)
❌ fetch_id column (redundant, can get via result_id)
❌ domain, rank_absolute (redundant, can get via result_id)
```

### What We ARE Storing (New Approach)

```
For keyword_id 1832 with 98 SERP results:
✅ 5 rows for EMD matches ONLY
✅ Simple schema: keyword_id, result_id, zone_id
✅ JOIN to zhe_serp_results when need domain/rank details
✅ Fast cache with pre-aggregated counts and top domains
```

---

## VISUAL SCHEMA DIAGRAM

```
                     ┌─────────────────────────────┐
                     │     ranking_zones           │
                     │  (7 rows, static)           │
                     │                             │
                     │ zone_id (PK)                │
                     │ zone_key                    │
                     │ zone_name                   │
                     │ min_rank, max_rank          │
                     └──────────────┬──────────────┘
                                    │
                                    │ FK
                                    ▼
┌──────────────────────┐   ┌────────────────────────────────────┐
│   keywordshub        │   │ keywordshub_serp_zone_emd_matches  │
│   (existing)         │   │  (NEW - 50K rows for 10K keywords) │
│                      │   │                                    │
│ keyword_id (PK) ────────►│ match_id (PK)                      │
│ rel_industry_id      │   │ keyword_id (FK) ───────────────────┼──┐
│ cached_city_name     │   │ result_id (FK)                     │  │
└──────────────────────┘   │ zone_id (FK)                       │  │
                           └─────────────┬──────────────────────┘  │
                                         │                          │
                                         │                          │
                                         ▼                          │
                     ┌─────────────────────────────────────┐        │
                     │ zhe_serp_results (existing)         │        │
                     │                                     │        │
                     │ result_id (PK)                      │        │
                     │ rel_fetch_id (FK)                   │        │
                     │ domain                              │        │
                     │ rank_absolute                       │        │
                     │ is_match_emd_stamp                  │        │
                     └─────────────────────────────────────┘        │
                                                                     │
                                                                     │
                          ┌──────────────────────────────────────────┘
                          │
                          ▼
         ┌────────────────────────────────────────────────────┐
         │   keywordshub_emd_zone_cache                       │
         │   (NEW - 10K rows for 10K keywords)                │
         │                                                    │
         │ keyword_id (PK, FK)                                │
         │ latest_fetch_id (FK)                               │
         │                                                    │
         │ SET 1: COUNT COLUMNS                               │
         │ ├─ total_emd_sites                                 │
         │ ├─ zone_1_count                                    │
         │ ├─ zone_2_count                                    │
         │ └─ ... (7 zone counts)                             │
         │                                                    │
         │ SET 2: DOMAIN COLUMNS                              │
         │ ├─ zone_1_domains (JSONB)                          │
         │ ├─ zone_2_domains (JSONB)                          │
         │ └─ ... (7 zone domain arrays)                      │
         └────────────────────────────────────────────────────┘
```

---

## IMPLEMENTATION CHECKLIST

### Phase 1: Database Setup
- [ ] Run SQL migration to create 3 new tables
- [ ] Verify foreign key constraints
- [ ] Verify indexes are created
- [ ] Test helper functions

### Phase 2: F420 API Route
- [ ] Create `/api/f420` route
- [ ] Implement zone determination logic
- [ ] Implement relations table population (EMD matches only)
- [ ] Implement cache aggregation logic
- [ ] Test with sample keyword

### Phase 3: Update Gazelle Flow
- [ ] Update Gazelle button on `/serpjar` to call F420 after F410
- [ ] Update Gazelle bulk function on `/kwjar` to call F420 after F410
- [ ] Add loading states and progress tracking
- [ ] Test end-to-end flow

### Phase 4: UI Components
- [ ] Update `/kwjar` page to fetch cache data
- [ ] Add 8 count columns to table
- [ ] Add 7 domain columns to table
- [ ] Style columns (separators, colors, etc.)
- [ ] Add drill-down functionality (click to see details)
- [ ] Add tooltips for domains

### Phase 5: Testing & Optimization
- [ ] Test with 100 keywords
- [ ] Test with 1000 keywords
- [ ] Verify query performance
- [ ] Add cache invalidation logic
- [ ] Add error handling

---

## NEXT STEPS

1. **Review this document** - Confirm architecture is correct
2. **Approve SQL schema** - Ready to run migration
3. **Build F420 API** - Core aggregation logic
4. **Update UI components** - Add dual column sets
5. **Test & deploy** - Verify performance

---

## QUESTIONS FOR REVIEW

1. ✅ Does the cache table structure support the dual column set UI?
2. ✅ Is storing only EMD matches (not all SERP results) acceptable?
3. ✅ Should we store top 5 domains per zone in JSONB, or a different number?
4. ✅ Is the F420 function name appropriate, or prefer different naming?
5. ✅ Should the system auto-run F420 after Gazelle, or make it manual?

---

**END OF PLANNING DOCUMENT 4**

Ready for your review and approval! 🚀
