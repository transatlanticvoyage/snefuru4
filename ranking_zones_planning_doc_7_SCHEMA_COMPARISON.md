# RANKING ZONES SYSTEM - PLANNING DOCUMENT 7

**Schema Comparison: Hybrid vs Kernel Approach**  
**Date**: October 16, 2025

---

## APPROACH 1: HYBRID (RECOMMENDED)

### Table 1: `ranking_zones` (Reference table - 7 rows)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| zone_id | SERIAL | PRIMARY KEY | Auto-increment |
| zone_key | VARCHAR(10) | NOT NULL, UNIQUE | '1', '2', '3', '4_10', '11_25', '26_50', '51_100' |
| zone_name | VARCHAR(50) | NOT NULL | 'Position 1', 'Positions 4-10', etc. |
| min_rank | INTEGER | NOT NULL | 1, 2, 3, 4, 11, 26, 51 |
| max_rank | INTEGER | NOT NULL | 1, 2, 3, 10, 25, 50, 100 |
| display_order | INTEGER | NOT NULL | 1, 2, 3, 4, 5, 6, 7 |
| created_at | TIMESTAMP | DEFAULT NOW() | |



---

### Table 2: `keywordshub_emd_zone_cache` (1 row per keyword per method)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| cache_id | SERIAL | PRIMARY KEY | Auto-increment |
| keyword_id | INTEGER | NOT NULL, FK → keywordshub | |
| emd_stamp_method | VARCHAR(50) | NOT NULL | 'method-1', 'method-2', 'method-3', etc. |
| latest_fetch_id | INTEGER | FK → zhe_serp_fetches | |
| **— COUNT COLUMNS —** | | | |
| total_emd_sites | INTEGER | DEFAULT 0 | Sum of all zones |
| zone_1_count | INTEGER | DEFAULT 0 | Count in position 1 |
| zone_2_count | INTEGER | DEFAULT 0 | Count in position 2 |
| zone_3_count | INTEGER | DEFAULT 0 | Count in position 3 |
| zone_4_10_count | INTEGER | DEFAULT 0 | Count in positions 4-10 |
| zone_11_25_count | INTEGER | DEFAULT 0 | Count in positions 11-25 |
| zone_26_50_count | INTEGER | DEFAULT 0 | Count in positions 26-50 |
| zone_51_100_count | INTEGER | DEFAULT 0 | Count in positions 51-100 |
| **— DOMAIN COLUMNS —** | | | |
| zone_1_domains | JSONB | | Array of top 5 domain objects |
| zone_2_domains | JSONB | | Array of top 5 domain objects |
| zone_3_domains | JSONB | | Array of top 5 domain objects |
| zone_4_10_domains | JSONB | | Array of top 5 domain objects |
| zone_11_25_domains | JSONB | | Array of top 5 domain objects |
| zone_26_50_domains | JSONB | | Array of top 5 domain objects |
| zone_51_100_domains | JSONB | | Array of top 5 domain objects |
| cached_at | TIMESTAMP | DEFAULT NOW() | |
| cache_version | INTEGER | DEFAULT 1 | For schema migrations |

**Constraints:**
- UNIQUE (keyword_id, emd_method)

**JSONB Structure:**
```json
[
  {"domain": "pestcontrol.com", "rank": 1, "result_id": 4854},
  {"domain": "pest-orlando.com", "rank": 7, "result_id": 4861}
]
```

---

### Table 3: `keywordshub_serp_zone_emd_matches` (Relations - EMD matches only)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| match_id | SERIAL | PRIMARY KEY | Auto-increment |
| keyword_id | INTEGER | NOT NULL, FK → keywordshub | |
| result_id | INTEGER | NOT NULL, FK → zhe_serp_results | |
| zone_id | INTEGER | NOT NULL, FK → ranking_zones | |
| emd_stamp_method | VARCHAR(50) | NOT NULL | 'method-1', 'method-2', 'method-3', etc. |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Constraints:**
- UNIQUE (result_id, zone_id, emd_method) — Same result can match multiple methods

**Indexes:**
- idx_kszem_keyword_id ON (keyword_id)
- idx_kszem_result_id ON (result_id)
- idx_kszem_zone_id ON (zone_id)
- idx_kszem_keyword_zone_method ON (keyword_id, zone_id, emd_method)

---

### Storage Metrics (10K keywords, 3 methods, avg 5 EMD matches per method)

| Metric | Value |
|--------|-------|
| Cache table rows | 30,000 (10K × 3 methods) |
| Relations table rows | 150,000 (10K × 3 methods × 5 matches) |
| Cache storage | ~60 MB |
| Relations storage | ~5 MB |
| Total storage | ~65 MB |
| UI query (1000 kw) | 3 LEFT JOINs, ~100ms |

---

### Example Query (Hybrid Approach)

```sql
-- Load all data for 1000 keywords with 3 methods
SELECT 
  k.keyword_id,
  k.keyword_datum,
  
  -- Method 1
  c1.total_emd_sites as m1_total,
  c1.zone_1_count as m1_z1_count,
  c1.zone_1_domains as m1_z1_domains,
  -- ... all zones for method 1
  
  -- Method 2
  c2.total_emd_sites as m2_total,
  c2.zone_1_count as m2_z1_count,
  c2.zone_1_domains as m2_z1_domains,
  -- ... all zones for method 2
  
  -- Method 3
  c3.total_emd_sites as m3_total,
  c3.zone_1_count as m3_z1_count,
  c3.zone_1_domains as m3_z1_domains
  -- ... all zones for method 3

FROM keywordshub k
LEFT JOIN keywordshub_emd_zone_cache c1 
  ON c1.keyword_id = k.keyword_id AND c1.emd_method = 'method-1'
LEFT JOIN keywordshub_emd_zone_cache c2 
  ON c2.keyword_id = k.keyword_id AND c2.emd_method = 'method-2'
LEFT JOIN keywordshub_emd_zone_cache c3 
  ON c3.keyword_id = k.keyword_id AND c3.emd_method = 'method-3'
WHERE k.keyword_tag_id = 17
ORDER BY k.keyword_id;
```

---

## APPROACH 2: KERNEL (ORIGINAL)

### Table 1: `ranking_zones` (Same as Hybrid)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| zone_id | SERIAL | PRIMARY KEY | Auto-increment |
| zone_key | VARCHAR(10) | NOT NULL, UNIQUE | '1', '2', '3', '4_10', '11_25', '26_50', '51_100' |
| zone_name | VARCHAR(50) | NOT NULL | 'Position 1', 'Positions 4-10', etc. |
| min_rank | INTEGER | NOT NULL | 1, 2, 3, 4, 11, 26, 51 |
| max_rank | INTEGER | NOT NULL | 1, 2, 3, 10, 25, 50, 100 |
| display_order | INTEGER | NOT NULL | 1, 2, 3, 4, 5, 6, 7 |
| created_at | TIMESTAMP | DEFAULT NOW() | |

---

### Table 2: `serp_zone_kernels` (7 rows per keyword per method)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| kernel_id | SERIAL | PRIMARY KEY | Auto-increment |
| rel_keyword_id | INTEGER | NOT NULL, FK → keywordshub | |
| zone_definition | VARCHAR(10) | NOT NULL | '1', '2', '3', '4_10', '11_25', '26_50', '51_100' |
| emd_stamp_method | VARCHAR(50) | NOT NULL | 'emd-stamp-method-1', 'emd-stamp-method-2', etc. |
| count_of_emd_stamped_results | INTEGER | DEFAULT 0 | Count of EMD matches in this zone |
| emd_detailed_data | JSONB | | Array of domain objects (same structure as Hybrid) |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Constraints:**
- UNIQUE (rel_keyword_id, zone_definition, emd_stamp_method)

**JSONB Structure:**
```json
[
  {"domain": "pestcontrol.com", "rank": 1, "result_id": 4854},
  {"domain": "pest-orlando.com", "rank": 7, "result_id": 4861}
]
```

---

### Table 3: `relations_zhe_serp_results_to_ranking_zone_kernels` (Relations)

| Column | Type | Constraints | Notes |
|--------|------|-------------|-------|
| relation_id | SERIAL | PRIMARY KEY | Auto-increment |
| result_id | INTEGER | NOT NULL, FK → zhe_serp_results | |
| kernel_id | INTEGER | NOT NULL, FK → serp_zone_kernels | |
| created_at | TIMESTAMP | DEFAULT NOW() | |

**Constraints:**
- UNIQUE (result_id, kernel_id)

**Indexes:**
- idx_rel_result_id ON (result_id)
- idx_rel_kernel_id ON (kernel_id)

---

### Storage Metrics (10K keywords, 3 methods, avg 5 EMD matches per method)

| Metric | Value |
|--------|-------|
| Kernel table rows | 210,000 (10K × 3 methods × 7 zones) |
| Relations table rows | 150,000 (10K × 3 methods × 5 matches) |
| Kernel storage | ~25 MB |
| Relations storage | ~5 MB |
| Total storage | ~30 MB |
| UI query (1000 kw) | 21 LEFT JOINs (7 per method), ~200ms |

---

### Example Query (Kernel Approach)

```sql
-- Load all data for 1000 keywords with 3 methods
-- Must aggregate 7 kernel rows per keyword per method

SELECT 
  k.keyword_id,
  k.keyword_datum,
  
  -- Method 1 aggregation (7 kernels → 1 row)
  SUM(CASE WHEN k1.zone_definition = '1' THEN k1.count_of_emd_stamped_results ELSE 0 END) as m1_z1_count,
  MAX(CASE WHEN k1.zone_definition = '1' THEN k1.emd_detailed_data END) as m1_z1_domains,
  SUM(CASE WHEN k1.zone_definition = '2' THEN k1.count_of_emd_stamped_results ELSE 0 END) as m1_z2_count,
  MAX(CASE WHEN k1.zone_definition = '2' THEN k1.emd_detailed_data END) as m1_z2_domains,
  -- ... all 7 zones for method 1
  
  -- Method 2 aggregation (7 kernels → 1 row)
  SUM(CASE WHEN k2.zone_definition = '1' THEN k2.count_of_emd_stamped_results ELSE 0 END) as m2_z1_count,
  MAX(CASE WHEN k2.zone_definition = '1' THEN k2.emd_detailed_data END) as m2_z1_domains,
  -- ... all 7 zones for method 2
  
  -- Method 3 aggregation (7 kernels → 1 row)
  SUM(CASE WHEN k3.zone_definition = '1' THEN k3.count_of_emd_stamped_results ELSE 0 END) as m3_z1_count,
  MAX(CASE WHEN k3.zone_definition = '1' THEN k3.emd_detailed_data END) as m3_z1_domains
  -- ... all 7 zones for method 3

FROM keywordshub k
LEFT JOIN serp_zone_kernels k1 
  ON k1.rel_keyword_id = k.keyword_id AND k1.emd_stamp_method = 'emd-stamp-method-1'
LEFT JOIN serp_zone_kernels k2 
  ON k2.rel_keyword_id = k.keyword_id AND k2.emd_stamp_method = 'emd-stamp-method-2'
LEFT JOIN serp_zone_kernels k3 
  ON k3.rel_keyword_id = k.keyword_id AND k3.emd_stamp_method = 'emd-stamp-method-3'
WHERE k.keyword_tag_id = 17
GROUP BY k.keyword_id, k.keyword_datum
ORDER BY k.keyword_id;
```

---

## SIDE-BY-SIDE COMPARISON

| Aspect | Hybrid Approach | Kernel Approach |
|--------|----------------|-----------------|
| **Cache/Kernel Table Rows** | 30,000 | 210,000 |
| **Rows per keyword per method** | 1 | 7 |
| **Total Storage** | ~65 MB | ~30 MB |
| **Storage Difference** | +35 MB | Baseline |
| **UI Query JOINs** | 3 (one per method) | 3 (one per method) |
| **UI Query Aggregation** | None (1 row = 1 display row) | Required (7 rows → 1 display row) |
| **Query Complexity** | Simple | Complex (CASE statements) |
| **Query Performance** | ~100ms | ~200ms |
| **Add New Method** | Insert 10K rows (one per keyword) | Insert 70K rows (7 per keyword) |
| **Query Specific Zone** | Must load full row | Can query single kernel |
| **Flexibility** | High | Very High |

---

## EXAMPLE DATA

### Hybrid Approach: keyword_id 1832, method-1 (1 row)

**keywordshub_emd_zone_cache:**

| cache_id | keyword_id | emd_method | total | z1_cnt | z2_cnt | z3_cnt | z4_10_cnt | z11_25_cnt | z1_domains | z4_10_domains |
|----------|------------|------------|-------|--------|--------|--------|-----------|------------|------------|---------------|
| 5001 | 1832 | method-1 | 5 | 1 | 0 | 1 | 2 | 1 | `[{...}]` | `[{...},{...}]` |

**keywordshub_serp_zone_emd_matches:**

| match_id | keyword_id | result_id | zone_id | emd_method |
|----------|------------|-----------|---------|------------|
| 10001 | 1832 | 4854 | 1 | method-1 |
| 10002 | 1832 | 4856 | 3 | method-1 |
| 10003 | 1832 | 4861 | 4 | method-1 |
| 10004 | 1832 | 4863 | 4 | method-1 |
| 10005 | 1832 | 4872 | 5 | method-1 |

---

### Kernel Approach: keyword_id 1832, method-1 (7 rows)

**serp_zone_kernels:**

| kernel_id | rel_keyword_id | zone_definition | emd_stamp_method | count | emd_detailed_data |
|-----------|----------------|-----------------|------------------|-------|-------------------|
| 93 | 1832 | 1 | emd-stamp-method-1 | 1 | `[{"domain":"pestcontrol-batonrouge.com","rank":1,"result_id":4854}]` |
| 94 | 1832 | 2 | emd-stamp-method-1 | 0 | `[]` |
| 95 | 1832 | 3 | emd-stamp-method-1 | 1 | `[{"domain":"batonrougepest.com","rank":3,"result_id":4856}]` |
| 96 | 1832 | 4_10 | emd-stamp-method-1 | 2 | `[{...},{...}]` |
| 97 | 1832 | 11_25 | emd-stamp-method-1 | 1 | `[{...}]` |
| 98 | 1832 | 26_50 | emd-stamp-method-1 | 0 | `[]` |
| 99 | 1832 | 51_100 | emd-stamp-method-1 | 0 | `[]` |

**relations_zhe_serp_results_to_ranking_zone_kernels:**

| relation_id | result_id | kernel_id |
|-------------|-----------|-----------|
| 1 | 4854 | 93 |
| 2 | 4856 | 95 |
| 3 | 4861 | 96 |
| 4 | 4863 | 96 |
| 5 | 4872 | 97 |

---

## RECOMMENDATION

**Use Hybrid Approach** for:
- ✅ Simpler UI queries (no aggregation needed)
- ✅ Faster performance (~100ms vs ~200ms)
- ✅ Easier to maintain and debug
- ✅ Standard pattern (one cache row per entity)

**Use Kernel Approach** for:
- ✅ Less storage (~30 MB vs ~65 MB)
- ✅ Granular zone queries (if frequently needed)
- ✅ Maximum flexibility per zone
- ✅ Independent zone operations

**For most use cases**: Hybrid approach is recommended. The +35 MB storage cost is worth the simplicity and performance gain.

---

**END OF PLANNING DOCUMENT 7**
