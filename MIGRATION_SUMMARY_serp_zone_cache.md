# ✅ SERP Zone Cache Migration - COMPLETE

## **Migration Status: Ready to Execute**

---

## **📋 WHAT WAS CHANGED:**

### **1. SQL Migration (File: `migrate_to_serp_zone_cache_FINAL.sql`)**

#### **A. Table Renamed:**
```sql
keywordshub_emd_zone_cache → keywordshub_serp_zone_cache
```

#### **B. Columns Renamed (8 total):**
```sql
total_emd_sites     → total_emd_count
zone_1_count        → zone_1_emd_count
zone_2_count        → zone_2_emd_count
zone_3_count        → zone_3_emd_count
zone_4_10_count     → zone_4_10_emd_count
zone_11_25_count    → zone_11_25_emd_count
zone_26_50_count    → zone_26_50_emd_count
zone_51_100_count   → zone_51_100_emd_count
```

#### **C. Domain Columns (No Rename):**
```sql
zone_1_domains      ✅ (JSONB structure updated)
zone_2_domains      ✅ (JSONB structure updated)
zone_3_domains      ✅ (JSONB structure updated)
zone_4_10_domains   ✅ (JSONB structure updated)
zone_11_25_domains  ✅ (JSONB structure updated)
zone_26_50_domains  ✅ (JSONB structure updated)
zone_51_100_domains ✅ (JSONB structure updated)
```

#### **D. JSONB Migration:**
**OLD (EMD-only array):**
```json
[
  {"domain": "pestbr.com", "rank": 4, "url": "https://...", "result_id": 123}
]
```

**NEW (all domains with EMD flags):**
```json
{
  "domains": [
    {"domain": "pestbr.com", "rank": 4, "url": "https://...", "is_emd_m1": true},
    {"domain": "example.com", "rank": 5, "url": "https://...", "is_emd_m1": false}
  ]
}
```

#### **E. View Renamed:**
```sql
v_emd_matches_full → v_serp_zone_cache_full
```

---

### **2. Backend Code Updates**

#### **A. F420 API Route (`/app/api/f420/route.ts`)** ✅
- Updated table name: `keywordshub_serp_zone_cache`
- Updated column names: `zone_X_emd_count`, `total_emd_count`
- **NEW:** Fetches ALL domains (not just EMD)
- **NEW:** Adds `is_emd_m1: true/false` flag per domain
- **NEW:** Wraps domains in `{"domains": [...]}` structure
- **NEW:** Console logs show "Total domains: X, EMD matches: Y"

#### **B. F400 Routes (f400, f400-live, f400-complete)** ✅
- Updated table name in cache invalidation queries
- Uses `keywordshub_serp_zone_cache`

---

### **3. Frontend Code Updates**

#### **A. KeywordsHubTable.tsx (`/app/(protected)/kwjar/components/`)** ✅

**TypeScript Interface Updated:**
```typescript
serp_cache_m1?: {
  total_emd_count: number | null;
  zone_1_emd_count: number | null;
  // ... (all zone counts)
  zone_1_domains: { domains: Array<{
    domain: string;
    rank: number;
    url: string;
    is_emd_m1: boolean;
  }> } | null;
  // ... (all zone domains)
}
```

**Column Definitions Updated:**
```typescript
// Count columns:
{ key: 'serp_cache_m1.zone_1_emd_count', ... }

// Domain columns:
{ key: 'serp_cache_m1.zone_1_domains', type: 'serp_domains', ... }
```

**Supabase Query Updated:**
```typescript
.from('keywordshub_serp_zone_cache')
.select('total_emd_count, zone_1_emd_count, zone_1_domains, ...')
```

**Rendering Logic Updated:**
```typescript
// NEW: Color domains based on is_emd_m1 flag
className={domainObj.is_emd_m1 ? 'text-blue-600' : 'text-black'}
```

**Data Assignment Updated:**
```typescript
serp_cache_m1: cacheByKeywordId[keyword.keyword_id] || null
```

**Staleness Indicator Updated:**
```typescript
column.key.includes('serp_cache_m1') && column.key.includes('_emd_count')
```

#### **B. SerpJar pclient.tsx (`/app/(protected)/serpjar/`)** ✅

**Cache Status Query Updated:**
```typescript
.from('keywordshub_serp_zone_cache')
```

---

## **🚀 EXECUTION STEPS:**

### **Step 1: Run SQL Migration in Supabase**
```sql
-- Execute the migration file:
-- migrate_to_serp_zone_cache_FINAL.sql
```

**This will:**
1. Rename table
2. Rename 8 columns
3. Execute JSONB migration function
4. Update view

**Expected output:**
```
| migrated_rows | migrated_at           |
| 22            | 2025-10-17 14:45:...  |
```

### **Step 2: Verify Migration**
```sql
SELECT 
  keyword_id,
  total_emd_count,
  zone_1_emd_count,
  zone_4_10_emd_count,
  jsonb_typeof(zone_1_domains) as zone_1_type,
  zone_1_domains->'domains'->0 as sample_domain
FROM keywordshub_serp_zone_cache
WHERE is_current = TRUE
LIMIT 5;
```

**Expected:**
- `zone_1_type` should be `"object"` (not `"array"`)
- `sample_domain` should have `"is_emd_m1": true`

### **Step 3: Test F420**
Navigate to `/serpjar?keyword_id=1822` and run Gazelle or F420 manually.

**Expected console output:**
```
F420: Found 97 total domains, 3 EMD matches
F420: ✅ Universal SERP Zone Cache updated successfully
```

### **Step 4: Verify /kwjar Display**
Navigate to `/kwjar` and check zone columns.

**Expected UI:**
- EMD domains in **blue**
- Non-EMD domains in **black**
- All domains displayed (not just EMD)
- Staleness indicators work (⚠️, ✗)

---

## **📊 FILES MODIFIED (7 total):**

1. ✅ `migrate_to_serp_zone_cache_FINAL.sql` (new)
2. ✅ `/app/api/f420/route.ts`
3. ✅ `/app/api/f400/route.ts`
4. ✅ `/app/api/f400-live/route.ts`
5. ✅ `/app/api/f400-complete/route.ts`
6. ✅ `/app/(protected)/kwjar/components/KeywordsHubTable.tsx`
7. ✅ `/app/(protected)/serpjar/pclient.tsx`

---

## **🎯 TESTING CHECKLIST:**

After running SQL migration:

- [ ] SQL migration completes without errors
- [ ] Verification query shows `"object"` type and `is_emd_m1` field
- [ ] `/kwjar` page loads without errors
- [ ] Zone columns display data
- [ ] `/serpjar` page loads without errors
- [ ] Run F420 on a test keyword (e.g., 1822)
- [ ] Verify F420 console shows "total domains" and "EMD matches"
- [ ] Check `/kwjar` - domains should show EMD (blue) and non-EMD (black)
- [ ] Verify staleness indicators still work
- [ ] Run Gazelle on `/serpjar` - should work end-to-end

---

## **🔄 ROLLBACK PLAN (If Needed):**

If something goes wrong, run:
```sql
-- Revert table name
ALTER TABLE keywordshub_serp_zone_cache 
RENAME TO keywordshub_emd_zone_cache;

-- Revert column names
ALTER TABLE keywordshub_emd_zone_cache
RENAME COLUMN total_emd_count TO total_emd_sites;
-- ... (repeat for all 7 zone columns)

-- JSONB data will need manual cleanup or DB restore
```

Or restore from Supabase backup if available.

---

## **✅ READY TO PROCEED**

All code changes are complete. Execute SQL migration when ready!

