# RANKING ZONES ARCHITECTURE - EXAMPLE DATA

Complete example values for all database columns in the Enhanced Variation 3B schema.

---

## TABLE 1: `ranking_zones`

**Purpose**: Defines the 7 ranking zones used for SERP analysis

| zone_id | zone_key | zone_name          | min_rank | max_rank | display_order | created_at                |
|---------|----------|--------------------|----------|----------|---------------|---------------------------|
| 1       | 1        | Position 1         | 1        | 1        | 1             | 2025-10-16 14:32:15       |
| 2       | 2        | Position 2         | 2        | 2        | 2             | 2025-10-16 14:32:15       |
| 3       | 3        | Position 3         | 3        | 3        | 3             | 2025-10-16 14:32:15       |
| 4       | 4_10     | Positions 4-10     | 4        | 10       | 4             | 2025-10-16 14:32:15       |
| 5       | 11_25    | Positions 11-25    | 11       | 25       | 5             | 2025-10-16 14:32:15       |
| 6       | 26_50    | Positions 26-50    | 26       | 50       | 6             | 2025-10-16 14:32:15       |
| 7       | 51_100   | Positions 51-100   | 51       | 100      | 7             | 2025-10-16 14:32:15       |

**Notes**:
- This table is pre-populated by the SQL migration
- `zone_id`: Auto-incrementing primary key
- `zone_key`: Used in queries and cache columns (e.g., 'zone_4_10_count')
- `display_order`: Controls column ordering in UI

---

## TABLE 2: `keywordshub_serp_zone_relations`

**Purpose**: Granular relations between keywords, zones, and SERP results

### Example 1: EMD Match in Position 1
| Column          | Value                                    | Notes                                      |
|-----------------|------------------------------------------|--------------------------------------------|
| relation_id     | 100234                                   | Auto-incrementing PK                       |
| keyword_id      | 1832                                     | FK → keywordshub.keyword_id                |
| fetch_id        | 57                                       | FK → zhe_serp_fetches.fetch_id             |
| result_id       | 4854                                     | FK → zhe_serp_results.result_id            |
| zone_id         | 1                                        | FK → ranking_zones.zone_id                 |
| zone_key        | 1                                        | Matches ranking_zones.zone_key             |
| domain          | pestcontrol-batonrouge.com               | Copy from zhe_serp_results.domain          |
| rank_absolute   | 1                                        | Copy from zhe_serp_results.rank_absolute   |
| is_emd_match    | TRUE                                     | Copy from zhe_serp_results.is_match_emd_stamp |
| created_at      | 2025-10-16 14:35:22                      | Timestamp when relation was created        |
| updated_at      | 2025-10-16 14:35:22                      | Timestamp when relation was updated        |

### Example 2: Non-EMD Result in Position 5
| Column          | Value                                    | Notes                                      |
|-----------------|------------------------------------------|--------------------------------------------|
| relation_id     | 100235                                   | Auto-incrementing PK                       |
| keyword_id      | 1832                                     | FK → keywordshub.keyword_id                |
| fetch_id        | 57                                       | FK → zhe_serp_fetches.fetch_id             |
| result_id       | 4859                                     | FK → zhe_serp_results.result_id            |
| zone_id         | 4                                        | FK → ranking_zones.zone_id (zone 4-10)     |
| zone_key        | 4_10                                     | Matches ranking_zones.zone_key             |
| domain          | terminix.com                             | Copy from zhe_serp_results.domain          |
| rank_absolute   | 5                                        | Copy from zhe_serp_results.rank_absolute   |
| is_emd_match    | FALSE                                    | Not an EMD match                           |
| created_at      | 2025-10-16 14:35:22                      | Timestamp when relation was created        |
| updated_at      | 2025-10-16 14:35:22                      | Timestamp when relation was updated        |

### Example 3: EMD Match in Position 18
| Column          | Value                                    | Notes                                      |
|-----------------|------------------------------------------|--------------------------------------------|
| relation_id     | 100236                                   | Auto-incrementing PK                       |
| keyword_id      | 1832                                     | FK → keywordshub.keyword_id                |
| fetch_id        | 57                                       | FK → zhe_serp_fetches.fetch_id             |
| result_id       | 4872                                     | FK → zhe_serp_results.result_id            |
| zone_id         | 5                                        | FK → ranking_zones.zone_id (zone 11-25)    |
| zone_key        | 11_25                                    | Matches ranking_zones.zone_key             |
| domain          | batonrougepestcontrol.com                | Copy from zhe_serp_results.domain          |
| rank_absolute   | 18                                       | Copy from zhe_serp_results.rank_absolute   |
| is_emd_match    | TRUE                                     | Is an EMD match                            |
| created_at      | 2025-10-16 14:35:22                      | Timestamp when relation was created        |
| updated_at      | 2025-10-16 14:35:22                      | Timestamp when relation was updated        |

**Complete Dataset for keyword_id 1832 (98 rows total)**:
```
- 98 rows total (one per SERP result)
- relation_id: 100234-100331 (sequential)
- keyword_id: 1832 (all rows)
- fetch_id: 57 (all rows, same fetch)
- result_id: 4854-4951 (one per SERP result)
- zone_id: 1-7 (distributed across zones)
- zone_key: '1', '2', '3', '4_10', '11_25', '26_50', '51_100'
- domain: Various domains
- rank_absolute: 1-98
- is_emd_match: TRUE for 5 rows, FALSE for 93 rows
```

---

## TABLE 3: `keywordshub_emd_zone_cache`

**Purpose**: Fast cache table for UI display (aggregated counts and top domains per zone)

### Example Row for keyword_id 1832 ("pest control baton rouge")

| Column                  | Value                                                                                                                                                          | Type      | Notes                                                    |
|-------------------------|----------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|----------------------------------------------------------|
| **keyword_id**          | 1832                                                                                                                                                           | INTEGER   | PK, FK → keywordshub.keyword_id                          |
| **latest_fetch_id**     | 57                                                                                                                                                             | INTEGER   | FK → zhe_serp_fetches.fetch_id                           |
| **— SET 1: COUNT COLUMNS —** |                                                                                                                                                          |           |                                                          |
| **total_emd_sites**     | 5                                                                                                                                                              | INTEGER   | Total EMD matches across all zones                       |
| **zone_1_count**        | 1                                                                                                                                                              | INTEGER   | 1 EMD match in position 1                                |
| **zone_2_count**        | 0                                                                                                                                                              | INTEGER   | 0 EMD matches in position 2                              |
| **zone_3_count**        | 1                                                                                                                                                              | INTEGER   | 1 EMD match in position 3                                |
| **zone_4_10_count**     | 2                                                                                                                                                              | INTEGER   | 2 EMD matches in positions 4-10                          |
| **zone_11_25_count**    | 1                                                                                                                                                              | INTEGER   | 1 EMD match in positions 11-25                           |
| **zone_26_50_count**    | 0                                                                                                                                                              | INTEGER   | 0 EMD matches in positions 26-50                         |
| **zone_51_100_count**   | 0                                                                                                                                                              | INTEGER   | 0 EMD matches in positions 51-100                        |
| **— SET 2: DOMAIN COLUMNS —** |                                                                                                                                                          |           |                                                          |
| **zone_1_domains**      | `[{"domain": "pestcontrol-batonrouge.com", "rank": 1, "result_id": 4854}]`                                                                                    | JSONB     | Array of top domains in zone 1 (max 5)                   |
| **zone_2_domains**      | `[]`                                                                                                                                                           | JSONB     | Empty array (no EMD matches in zone 2)                   |
| **zone_3_domains**      | `[{"domain": "batonrougepest.com", "rank": 3, "result_id": 4856}]`                                                                                            | JSONB     | Array of top domains in zone 3 (max 5)                   |
| **zone_4_10_domains**   | `[{"domain": "pestservicesbatonrouge.com", "rank": 7, "result_id": 4861}, {"domain": "batonrouge-pestcontrol.com", "rank": 9, "result_id": 4863}]`           | JSONB     | Array of top 2 domains in zone 4-10                      |
| **zone_11_25_domains**  | `[{"domain": "batonrougepestcontrol.com", "rank": 18, "result_id": 4872}]`                                                                                    | JSONB     | Array of top domains in zone 11-25 (max 5)               |
| **zone_26_50_domains**  | `[]`                                                                                                                                                           | JSONB     | Empty array (no EMD matches in zone 26-50)               |
| **zone_51_100_domains** | `[]`                                                                                                                                                           | JSONB     | Empty array (no EMD matches in zone 51-100)              |
| **cached_at**           | 2025-10-16 14:35:25                                                                                                                                            | TIMESTAMP | When cache was last updated                              |
| **cache_version**       | 1                                                                                                                                                              | INTEGER   | Cache schema version (for future migrations)             |

### Example Row for keyword_id 1813 ("pest control pittsburgh")

| Column                  | Value                                                                                                                                                                                                                                                                                                | Type      | Notes                                                    |
|-------------------------|------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|----------------------------------------------------------|
| **keyword_id**          | 1813                                                                                                                                                                                                                                                                                                 | INTEGER   | PK, FK → keywordshub.keyword_id                          |
| **latest_fetch_id**     | 58                                                                                                                                                                                                                                                                                                   | INTEGER   | FK → zhe_serp_fetches.fetch_id                           |
| **— SET 1: COUNT COLUMNS —** |                                                                                                                                                                                                                                                                                                |           |                                                          |
| **total_emd_sites**     | 4                                                                                                                                                                                                                                                                                                    | INTEGER   | Total EMD matches across all zones                       |
| **zone_1_count**        | 0                                                                                                                                                                                                                                                                                                    | INTEGER   | 0 EMD matches in position 1                              |
| **zone_2_count**        | 1                                                                                                                                                                                                                                                                                                    | INTEGER   | 1 EMD match in position 2                                |
| **zone_3_count**        | 0                                                                                                                                                                                                                                                                                                    | INTEGER   | 0 EMD matches in position 3                              |
| **zone_4_10_count**     | 1                                                                                                                                                                                                                                                                                                    | INTEGER   | 1 EMD match in positions 4-10                            |
| **zone_11_25_count**    | 2                                                                                                                                                                                                                                                                                                    | INTEGER   | 2 EMD matches in positions 11-25                         |
| **zone_26_50_count**    | 0                                                                                                                                                                                                                                                                                                    | INTEGER   | 0 EMD matches in positions 26-50                         |
| **zone_51_100_count**   | 0                                                                                                                                                                                                                                                                                                    | INTEGER   | 0 EMD matches in positions 51-100                        |
| **— SET 2: DOMAIN COLUMNS —** |                                                                                                                                                                                                                                                                                                |           |                                                          |
| **zone_1_domains**      | `[]`                                                                                                                                                                                                                                                                                                 | JSONB     | Empty array (no EMD matches in zone 1)                   |
| **zone_2_domains**      | `[{"domain": "pestpatrolpittsburgh.com", "rank": 2, "result_id": 3747}]`                                                                                                                                                                                                                            | JSONB     | Array of top domains in zone 2 (max 5)                   |
| **zone_3_domains**      | `[]`                                                                                                                                                                                                                                                                                                 | JSONB     | Empty array (no EMD matches in zone 3)                   |
| **zone_4_10_domains**   | `[{"domain": "excellentpestguysofpittsburgh.com", "rank": 8, "result_id": 3797}]`                                                                                                                                                                                                                   | JSONB     | Array of top domains in zone 4-10 (max 5)                |
| **zone_11_25_domains**  | `[{"domain": "pestpatrolpittsburgh.com", "rank": 14, "result_id": 4917}, {"domain": "excellentpestguysofpittsburgh.com", "rank": 19, "result_id": 4972}]`                                                                                                                                          | JSONB     | Array of top 2 domains in zone 11-25                     |
| **zone_26_50_domains**  | `[]`                                                                                                                                                                                                                                                                                                 | JSONB     | Empty array (no EMD matches in zone 26-50)               |
| **zone_51_100_domains** | `[]`                                                                                                                                                                                                                                                                                                 | JSONB     | Empty array (no EMD matches in zone 51-100)              |
| **cached_at**           | 2025-10-16 14:40:12                                                                                                                                                                                                                                                                                  | TIMESTAMP | When cache was last updated                              |
| **cache_version**       | 1                                                                                                                                                                                                                                                                                                    | INTEGER   | Cache schema version (for future migrations)             |

### Example Row with Many EMD Matches (keyword_id 1820, "pest control buffalo")

| Column                  | Value                                                                                                                                                                                                                                                                                                                                                                                      | Type      | Notes                                                    |
|-------------------------|---------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------------|-----------|----------------------------------------------------------|
| **keyword_id**          | 1820                                                                                                                                                                                                                                                                                                                                                                                        | INTEGER   | PK, FK → keywordshub.keyword_id                          |
| **latest_fetch_id**     | 57                                                                                                                                                                                                                                                                                                                                                                                          | INTEGER   | FK → zhe_serp_fetches.fetch_id                           |
| **— SET 1: COUNT COLUMNS —** |                                                                                                                                                                                                                                                                                                                                                                                   |           |                                                          |
| **total_emd_sites**     | 9                                                                                                                                                                                                                                                                                                                                                                                           | INTEGER   | Total EMD matches across all zones                       |
| **zone_1_count**        | 1                                                                                                                                                                                                                                                                                                                                                                                           | INTEGER   | 1 EMD match in position 1                                |
| **zone_2_count**        | 0                                                                                                                                                                                                                                                                                                                                                                                           | INTEGER   | 0 EMD matches in position 2                              |
| **zone_3_count**        | 1                                                                                                                                                                                                                                                                                                                                                                                           | INTEGER   | 1 EMD match in position 3                                |
| **zone_4_10_count**     | 3                                                                                                                                                                                                                                                                                                                                                                                           | INTEGER   | 3 EMD matches in positions 4-10                          |
| **zone_11_25_count**    | 2                                                                                                                                                                                                                                                                                                                                                                                           | INTEGER   | 2 EMD matches in positions 11-25                         |
| **zone_26_50_count**    | 1                                                                                                                                                                                                                                                                                                                                                                                           | INTEGER   | 1 EMD match in positions 26-50                           |
| **zone_51_100_count**   | 1                                                                                                                                                                                                                                                                                                                                                                                           | INTEGER   | 1 EMD match in positions 51-100                          |
| **— SET 2: DOMAIN COLUMNS —** |                                                                                                                                                                                                                                                                                                                                                                                   |           |                                                          |
| **zone_1_domains**      | `[{"domain": "buffalopestcontrol.com", "rank": 1, "result_id": 5201}]`                                                                                                                                                                                                                                                                                                                     | JSONB     | Top 1 domain in zone 1                                   |
| **zone_2_domains**      | `[]`                                                                                                                                                                                                                                                                                                                                                                                        | JSONB     | Empty array                                              |
| **zone_3_domains**      | `[{"domain": "pestcontrol-buffalo.com", "rank": 3, "result_id": 5203}]`                                                                                                                                                                                                                                                                                                                    | JSONB     | Top 1 domain in zone 3                                   |
| **zone_4_10_domains**   | `[{"domain": "buffalony-pestcontrol.com", "rank": 4, "result_id": 5204}, {"domain": "pestservicesbuffalo.com", "rank": 6, "result_id": 5206}, {"domain": "buffalopest.com", "rank": 9, "result_id": 5209}]`                                                                                                                                                                               | JSONB     | Top 3 domains in zone 4-10 (stored up to 5)              |
| **zone_11_25_domains**  | `[{"domain": "pestcontrolbuffalony.com", "rank": 14, "result_id": 5214}, {"domain": "buffalo-pestservices.com", "rank": 21, "result_id": 5221}]`                                                                                                                                                                                                                                          | JSONB     | Top 2 domains in zone 11-25                              |
| **zone_26_50_domains**  | `[{"domain": "pestguardiansbuffalo.com", "rank": 33, "result_id": 5233}]`                                                                                                                                                                                                                                                                                                                  | JSONB     | Top 1 domain in zone 26-50                               |
| **zone_51_100_domains** | `[{"domain": "buffalony-pestexperts.com", "rank": 67, "result_id": 5267}]`                                                                                                                                                                                                                                                                                                                 | JSONB     | Top 1 domain in zone 51-100                              |
| **cached_at**           | 2025-10-16 15:22:18                                                                                                                                                                                                                                                                                                                                                                         | TIMESTAMP | When cache was last updated                              |
| **cache_version**       | 1                                                                                                                                                                                                                                                                                                                                                                                           | INTEGER   | Cache schema version                                     |

---

## JSONB Domain Column Structure (Detailed)

Each domain JSONB column stores an array of objects with this structure:

```json
[
  {
    "domain": "pestcontrol-batonrouge.com",
    "rank": 1,
    "result_id": 4854
  },
  {
    "domain": "batonrougepest.com", 
    "rank": 7,
    "result_id": 4861
  },
  {
    "domain": "pestservicesbatonrouge.com",
    "rank": 9,
    "result_id": 4863
  }
]
```

**Field Descriptions:**
- `domain` (string): The domain name from zhe_serp_results
- `rank` (integer): The rank_absolute position (1-100)
- `result_id` (integer): FK to zhe_serp_results.result_id for drill-down

**Storage Rules:**
- Store **top 5 EMD matches** per zone (by rank_absolute)
- Empty array `[]` if no EMD matches in that zone
- Sorted by rank_absolute ascending (position 1 first)

---

## MODIFICATIONS TO EXISTING TABLES

### ✅ **NO MODIFICATIONS REQUIRED!**

All existing tables already have the columns we need:

#### `keywordshub` table
- ✅ Already has `keyword_id` (used as FK)
- ✅ Already has `rel_industry_id` (for emd_stamp_slug)
- ✅ Already has `cached_city_name` (for city matching)
- ✅ No changes needed

#### `zhe_serp_fetches` table
- ✅ Already has `fetch_id` (used as FK)
- ✅ Already has `rel_keyword_id` (links to keywordshub)
- ✅ No changes needed

#### `zhe_serp_results` table
- ✅ Already has `result_id` (used as FK)
- ✅ Already has `rel_fetch_id` (links to zhe_serp_fetches)
- ✅ Already has `domain` (copied to relations table)
- ✅ Already has `rank_absolute` (used for zone determination)
- ✅ Already has `is_match_emd_stamp` (added by F410 function)
- ✅ No changes needed

#### `industries` table
- ✅ Already has `industry_id`
- ✅ Already has `emd_stamp_slug` (used in F410 matching)
- ✅ No changes needed

---

## DATA FLOW EXAMPLE

### Scenario: User clicks Gazelle button for keyword_id 1832

**Step 1: F400 runs** → Fetches SERP results
```
Creates: fetch_id 57 in zhe_serp_fetches
Creates: result_ids 4854-4951 in zhe_serp_results (98 rows)
```

**Step 2: F410 runs** → Marks EMD matches
```
Updates: is_match_emd_stamp = TRUE for 5 results (4854, 4856, 4861, 4863, 4872)
```

**Step 3: F420 runs** → Creates relations and cache
```
Creates in keywordshub_serp_zone_relations:
- 98 rows (one per SERP result)
- relation_ids 100234-100331
- Links keyword 1832 → fetch 57 → results 4854-4951
- Assigns zone_id and zone_key based on rank_absolute
- Copies is_match_emd_stamp to is_emd_match

Creates in keywordshub_emd_zone_cache:
- 1 row for keyword_id 1832
- Counts: total=5, zone_1=1, zone_3=1, zone_4_10=2, zone_11_25=1
- Domains: Arrays with top 5 EMD domains per zone
```

**Step 4: UI loads /kwjar** → Fast display
```
Single query:
SELECT keyword_id, total_emd_sites, zone_1_count, zone_1_domains, ...
FROM keywordshub k
LEFT JOIN keywordshub_emd_zone_cache c ON c.keyword_id = k.keyword_id

Returns in ~50ms with all zone data ready for display
```

---

## SUMMARY

### New Tables Created (3)
1. ✅ `ranking_zones` - Zone definitions (7 rows, static)
2. ✅ `keywordshub_serp_zone_relations` - Granular relations (~98 rows per keyword)
3. ✅ `keywordshub_emd_zone_cache` - Fast cache (1 row per keyword)

### Existing Tables Modified
🎉 **NONE!** All existing tables already have the required columns.

### Total New Columns
- **15 columns** in keywordshub_emd_zone_cache (8 counts + 7 domains)
- **11 columns** in keywordshub_serp_zone_relations
- **6 columns** in ranking_zones

### Storage Estimates
- Relations table: ~1KB per keyword (98 rows × ~10 bytes)
- Cache table: ~2KB per keyword (JSONB + integers)
- Total for 1000 keywords: ~3MB

---

## READY TO PROCEED?

All systems ready! No existing table modifications required. 🚀
