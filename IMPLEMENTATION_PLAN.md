# RANKING ZONES SYSTEM - IMPLEMENTATION PLAN

**Date**: October 16, 2025  
**Status**: Ready to implement after SQL migration

---

## PHASE 1: DATABASE SETUP ✅ READY

### Step 1.1: Run SQL Migration

**File**: `FINAL_ranking_zones_schema.sql`

**Action**: 
1. Open Supabase SQL Editor
2. Copy entire contents of `FINAL_ranking_zones_schema.sql`
3. Run the SQL
4. Verify 3 tables created:
   - `ranking_zones` (7 rows)
   - `keywordshub_emd_zone_cache` (0 rows initially)
   - `relations_keywordshub_results_zones` (0 rows initially)

**Verification Query**:
```sql
SELECT COUNT(*) FROM ranking_zones;  -- Should return 7
```

---

## PHASE 2: F420 API ROUTE (Core Logic)

### Step 2.1: Create `/api/f420/route.ts`

**Purpose**: Aggregates EMD matches into zones and populates cache

**Input**:
```typescript
{
  keyword_id: number,
  emd_stamp_method: string  // 'method-1', 'method-2', etc.
}
```

**Logic Flow**:
```
1. Get latest fetch_id for keyword
2. Query zhe_serp_results WHERE is_match_emd_stamp = TRUE (for method-1)
3. For each EMD match:
   a. Determine zone_id from rank_absolute
   b. INSERT into relations_keywordshub_results_zones
4. Aggregate matches by zone (counts + top 5 domains)
5. UPSERT into keywordshub_emd_zone_cache
6. Return success with stats
```

**Output**:
```typescript
{
  success: true,
  keyword_id: 1832,
  emd_stamp_method: 'method-1',
  latest_fetch_id: 57,
  total_emd_sites: 5,
  zones_cached: 7,
  relations_created: 5
}
```

### Step 2.2: Zone Determination Logic

```typescript
function getZoneIdFromRank(rank: number): { zone_id: number, zone_key: string } {
  if (rank === 1) return { zone_id: 1, zone_key: '1' };
  if (rank === 2) return { zone_id: 2, zone_key: '2' };
  if (rank === 3) return { zone_id: 3, zone_key: '3' };
  if (rank >= 4 && rank <= 10) return { zone_id: 4, zone_key: '4_10' };
  if (rank >= 11 && rank <= 25) return { zone_id: 5, zone_key: '11_25' };
  if (rank >= 26 && rank <= 50) return { zone_id: 6, zone_key: '26_50' };
  if (rank >= 51 && rank <= 100) return { zone_id: 7, zone_key: '51_100' };
  return null;
}
```

---

## PHASE 3: /SERPJAR INTEGRATION

### Current 3-Step Process on `/serpjar`:

```
┌─────────────────────────────────────────────────────┐
│ Step 1: Run F400 (Fetch SERP)                      │
│ - Button: "Gazelle Aggregate Function"             │
│ - Calls: /api/f400-live                            │
│ - Creates: zhe_serp_fetches, zhe_serp_results      │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Step 2: Run F410 (EMD Stamp Match)                 │
│ - Automatically triggered after F400                │
│ - Calls: /api/f410                                 │
│ - Updates: is_match_emd_stamp = TRUE                │
└─────────────────────────────────────────────────────┘
                      ↓
┌─────────────────────────────────────────────────────┐
│ Step 3: Run F420 (Cache Ranking Zones) ← NEW!      │
│ - Button: "Run F420 Cache Ranking Zones"           │
│ - Calls: /api/f420                                 │
│ - Populates: cache + relations tables               │
└─────────────────────────────────────────────────────┘
```

### Step 3.1: Add F420 Button to `/serpjar`

**Location**: Mandible Chamber, after F410 button

**Button UI**:
```tsx
<button
  onClick={handleF420CacheZones}
  disabled={f420Loading}
  className="px-4 py-2 bg-green-600 text-white rounded hover:bg-green-700"
>
  {f420Loading ? 'Caching Zones...' : 'Step 3: Run F420 Cache Ranking Zones'}
</button>
```

### Step 3.2: F420 Handler Function

```tsx
const [f420Loading, setF420Loading] = useState(false);

const handleF420CacheZones = async () => {
  if (!keywordData?.keyword_id) {
    alert('No keyword loaded');
    return;
  }
  
  setF420Loading(true);
  
  try {
    const response = await fetch('/api/f420', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword_id: keywordData.keyword_id,
        emd_stamp_method: 'method-1'  // Start with method-1 only
      })
    });
    
    const data = await response.json();
    
    if (data.success) {
      alert(`✅ Zone cache built!\n\nTotal EMD sites: ${data.total_emd_sites}\nZones cached: ${data.zones_cached}\nRelations created: ${data.relations_created}`);
    } else {
      alert(`❌ Error: ${data.error}`);
    }
  } catch (error) {
    console.error('F420 error:', error);
    alert('Failed to cache zones');
  } finally {
    setF420Loading(false);
  }
};
```

### Step 3.3: Update Gazelle to Auto-Run F420

**Current Gazelle Flow**:
```
F400 → F410 → Done
```

**New Gazelle Flow**:
```
F400 → F410 → F420 → Done
```

**Update `handleGazelleAggregate` function**:
```tsx
const handleGazelleAggregate = async () => {
  // ... existing F400 code ...
  
  // Step 1: F400
  const f400Response = await fetch('/api/f400-live', { ... });
  
  // Step 2: F410
  const f410Response = await fetch('/api/f410', { ... });
  
  // Step 3: F420 (NEW!)
  const f420Response = await fetch('/api/f420', {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({
      keyword_id: keywordData.keyword_id,
      emd_stamp_method: 'method-1'
    })
  });
  
  const f420Data = await f420Response.json();
  
  alert(`
    ✅ Gazelle Complete!
    
    F400: ${f400Data.results_count} SERP results
    F410: ${f410Data.matches_found} EMD matches
    F420: ${f420Data.total_emd_sites} sites cached in ${f420Data.zones_cached} zones
  `);
};
```

---

## PHASE 4: CACHE INVALIDATION & STALE DATA

### 4.1: Cache Staleness Detection

**Stale cache occurs when**:
1. New SERP fetch happens (F400) but F420 not run
2. User updates industry/city but F420 not re-run
3. User re-runs F410 with different settings

**Detection Query**:
```sql
SELECT 
  k.keyword_id,
  c.latest_fetch_id as cached_fetch_id,
  zsf.fetch_id as newest_fetch_id,
  CASE 
    WHEN c.cache_id IS NULL THEN 'NO_CACHE'
    WHEN c.latest_fetch_id != zsf.fetch_id THEN 'STALE'
    ELSE 'CURRENT'
  END as status
FROM keywordshub k
LEFT JOIN keywordshub_emd_zone_cache c ON (
  c.keyword_id = k.keyword_id AND c.emd_stamp_method = 'method-1'
)
LEFT JOIN LATERAL (
  SELECT fetch_id FROM zhe_serp_fetches
  WHERE rel_keyword_id = k.keyword_id
  ORDER BY created_at DESC LIMIT 1
) zsf ON TRUE
WHERE k.keyword_id = 1832;
```

### 4.2: UI Indicator for Stale Cache

**On `/kwjar` page, add cache status column**:

```tsx
interface CacheStatus {
  status: 'CURRENT' | 'STALE' | 'NO_CACHE';
  cachedAt: string | null;
  cachedFetchId: number | null;
  newestFetchId: number | null;
}

// Display in table
<td className="text-xs">
  {cacheStatus.status === 'CURRENT' && (
    <span className="text-green-600">✓ Current</span>
  )}
  {cacheStatus.status === 'STALE' && (
    <span className="text-yellow-600">⚠ Stale</span>
  )}
  {cacheStatus.status === 'NO_CACHE' && (
    <span className="text-red-600">✗ No Cache</span>
  )}
</td>
```

### 4.3: Auto-Invalidation Triggers

**Automatically clear cache when**:
1. User changes `rel_industry_id` (affects emd_stamp_slug)
2. User changes `cached_city_name` (affects EMD matching)
3. User re-runs F410 (new matches may be found)

**Implementation** (in relevant update handlers):
```tsx
// After updating industry or city
await supabase
  .from('keywordshub_emd_zone_cache')
  .delete()
  .eq('keyword_id', keywordId)
  .eq('emd_stamp_method', 'method-1');

// Show message to user
alert('Industry/city updated. Please run F420 to refresh zone cache.');
```

### 4.4: Bulk Cache Refresh

**Add button on `/kwjar` for bulk cache refresh**:

```tsx
<button onClick={handleBulkF420}>
  Refresh Zone Cache for Selected Keywords
</button>

const handleBulkF420 = async () => {
  for (const keywordId of selectedKeywordIds) {
    await fetch('/api/f420', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        keyword_id: keywordId,
        emd_stamp_method: 'method-1'
      })
    });
  }
  alert(`Cache refreshed for ${selectedKeywordIds.length} keywords`);
};
```

---

## PHASE 5: UI COLUMNS ON `/KWJAR`

### 5.1: Column Structure (Method-1 Only)

**Add 15 new columns at far right of existing table**:

```
┌─────────────────────────────────────────────────────────────────────────────┐
│ ... existing columns ...  │  METHOD-1 COLUMNS (15 new)                      │
├───────────────────────────┼──────────────────────────────────────────────────┤
│                           │ Cache │ Total │ z1 │ z2 │ z3 │4-10│11-25│ ... │
│                           │Status │  EMD  │    │    │    │    │     │ ... │
├───────────────────────────┼───────┼───────┼────┼────┼────┼────┼─────┼─────┤
│ pest control baton rouge  │   ✓   │   5   │ 1  │ 0  │ 1  │ 2  │  1  │ ... │
└───────────────────────────┴───────┴───────┴────┴────┴────┴────┴─────┴─────┘
```

**Column List (15 total)**:

**SET 1: Status + Counts (8 columns)**:
1. Cache Status (indicator)
2. Total EMD Sites
3. Zone 1 Count
4. Zone 2 Count
5. Zone 3 Count
6. Zone 4-10 Count
7. Zone 11-25 Count
8. Zone 26-50 Count
9. Zone 51-100 Count

**SET 2: Domains (7 columns)**:
10. Zone 1 Domains
11. Zone 2 Domains
12. Zone 3 Domains
13. Zone 4-10 Domains
14. Zone 11-25 Domains
15. Zone 26-50 Domains
16. Zone 51-100 Domains

### 5.2: Column Definitions

```typescript
// In KeywordsHubTable.tsx

// After existing columns, add method-1 columns
const method1Columns: ColumnDefinition[] = [
  // Cache status indicator
  {
    key: 'emd_cache_m1.cache_status',
    label: 'Cache Status',
    type: 'cache_status',
    headerRow1Text: 'method-1',
    headerRow2Text: 'status',
    leftSeparator: 'black-4px'  // Visual separator from existing columns
  },
  
  // Count columns
  {
    key: 'emd_cache_m1.total_emd_sites',
    label: 'Total EMD',
    type: 'number',
    headerRow1Text: 'count',
    headerRow2Text: 'total'
  },
  {
    key: 'emd_cache_m1.zone_1_count',
    label: 'Zone 1',
    type: 'number',
    headerRow1Text: 'zone',
    headerRow2Text: '1'
  },
  {
    key: 'emd_cache_m1.zone_2_count',
    label: 'Zone 2',
    type: 'number',
    headerRow1Text: 'zone',
    headerRow2Text: '2'
  },
  // ... zones 3, 4_10, 11_25, 26_50, 51_100
  
  // Domain columns
  {
    key: 'emd_cache_m1.zone_1_domains',
    label: 'Zone 1 Domains',
    type: 'emd_domains',
    headerRow1Text: 'domains',
    headerRow2Text: '1',
    leftSeparator: 'black-4px'  // Visual separator between counts and domains
  },
  {
    key: 'emd_cache_m1.zone_2_domains',
    label: 'Zone 2 Domains',
    type: 'emd_domains',
    headerRow1Text: 'zone',
    headerRow2Text: '2'
  },
  // ... zones 3, 4_10, 11_25, 26_50, 51_100
];
```

### 5.3: Custom Cell Renderers

**For domain columns** (type: 'emd_domains'):
```tsx
// Render JSONB domain array
const renderEmdDomains = (domains: any) => {
  if (!domains || domains.length === 0) {
    return <span className="text-gray-400">-</span>;
  }
  
  return (
    <div className="flex flex-col gap-1 text-xs">
      {domains.slice(0, 3).map((item: any, idx: number) => (
        <div key={idx} className="flex items-center gap-1">
          <span className="text-gray-500 text-[10px]">#{item.rank}</span>
          <a 
            href={`/serpjar?keyword_id=${row.keyword_id}`}
            className="text-blue-600 hover:underline truncate max-w-[150px]"
            title={item.domain}
          >
            {item.domain}
          </a>
        </div>
      ))}
      {domains.length > 3 && (
        <span className="text-gray-500 text-[10px]">+{domains.length - 3} more</span>
      )}
    </div>
  );
};
```

### 5.4: Data Fetching

**Update query to include cache data**:
```typescript
const { data, error } = await supabase
  .from('keywordshub')
  .select(`
    *,
    emd_cache_m1:keywordshub_emd_zone_cache!inner (
      cache_id,
      total_emd_sites,
      zone_1_count,
      zone_2_count,
      zone_3_count,
      zone_4_10_count,
      zone_11_25_count,
      zone_26_50_count,
      zone_51_100_count,
      zone_1_domains,
      zone_2_domains,
      zone_3_domains,
      zone_4_10_domains,
      zone_11_25_domains,
      zone_26_50_domains,
      zone_51_100_domains,
      cached_at,
      latest_fetch_id
    )
  `)
  .eq('emd_cache_m1.emd_stamp_method', 'method-1')
  .eq('keyword_tag_id', selectedTagId);
```

---

## IMPLEMENTATION ROADMAP

### Week 1: Core Infrastructure
- [x] Design schema ✅
- [ ] Run SQL migration in Supabase
- [ ] Create `/api/f420` route
- [ ] Test F420 with sample keyword
- [ ] Verify cache and relations tables populate correctly

### Week 2: /serpjar Integration
- [ ] Add F420 button to Mandible Chamber
- [ ] Implement F420 handler function
- [ ] Update Gazelle to auto-run F420
- [ ] Test 3-step flow (F400 → F410 → F420)
- [ ] Add loading states and error handling

### Week 3: Cache Management
- [ ] Implement cache staleness detection
- [ ] Add cache status indicators to UI
- [ ] Implement auto-invalidation on industry/city changes
- [ ] Add bulk cache refresh functionality
- [ ] Test cache invalidation scenarios

### Week 4: /kwjar UI Columns
- [ ] Add 15 new columns to KeywordsHubTable
- [ ] Implement custom cell renderers (domains, cache status)
- [ ] Update data fetching query
- [ ] Style columns with separators and colors
- [ ] Test with 100+ keywords

### Week 5: Testing & Polish
- [ ] Performance testing (1000 keywords)
- [ ] Cache hit/miss monitoring
- [ ] User feedback on UI
- [ ] Documentation
- [ ] Bug fixes

---

## TESTING CHECKLIST

### Basic Functionality
- [ ] SQL migration runs without errors
- [ ] ranking_zones table has 7 rows
- [ ] F420 creates cache row for keyword
- [ ] F420 creates relations rows for each EMD match
- [ ] JSONB domains are properly formatted

### /serpjar Page
- [ ] F420 button appears and works
- [ ] Gazelle runs all 3 steps (F400 → F410 → F420)
- [ ] Loading states show correctly
- [ ] Error messages are helpful
- [ ] Success alerts show stats

### /kwjar Page
- [ ] 15 new columns display correctly
- [ ] Cache status indicators work
- [ ] Domain columns render JSONB properly
- [ ] Counts match actual EMD matches
- [ ] Clicking domain links to /serpjar

### Cache Invalidation
- [ ] Stale cache detected after new F400 fetch
- [ ] Cache cleared when industry changed
- [ ] Cache cleared when city changed
- [ ] Bulk refresh works for selected keywords

### Performance
- [ ] Page loads in < 200ms with 1000 keywords
- [ ] F420 completes in < 5 seconds per keyword
- [ ] Bulk F420 shows progress indicator

---

## ROLLBACK PLAN

If issues arise, rollback by:
1. Delete new tables: `DROP TABLE relations_keywordshub_results_zones, keywordshub_emd_zone_cache, ranking_zones;`
2. Remove F420 API route
3. Remove UI columns from /kwjar
4. Remove F420 button from /serpjar

---

**END OF IMPLEMENTATION PLAN**
