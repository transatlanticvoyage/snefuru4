# Gazelle Helper - Batch Monitoring & Resume System

**Date:** October 17, 2025  
**Feature:** Monitor and resume stalled Gazelle batch operations

---

## Summary

Created a new `/gazelle_helper` page that monitors all Gazelle batch operations from both `/kwjar` (bulk) and `/serpjar` (single), identifies stalled batches, and provides the ability to resume incomplete operations.

---

## Problem Statement

### Issues Identified:
1. **Bulk Gazelle submissions** from `/kwjar` were stalling partway through
2. **No visibility** into batch progress or status
3. **No way to recover** from stalled batches
4. **Keywords left unprocessed** when batches fail mid-way

### Solution:
A centralized monitoring dashboard that:
- Shows all recent Gazelle batches
- Identifies stalled operations (running > 30 minutes with pending keywords)
- Allows resuming stalled batches to complete remaining keywords
- Provides real-time progress tracking
- Auto-refreshes every 30 seconds

---

## Files Created

### 1. **`app/(protected)/gazelle_helper/page.tsx`**
- Server component wrapper
- Routes to client component

### 2. **`app/(protected)/gazelle_helper/pclient.tsx`**
- Main client component with full UI
- Fetches and displays batch data
- Implements filtering and sorting
- Handles resume functionality
- Auto-refresh capability

### 3. **`app/api/gazelle-resume/route.ts`**
- API endpoint for resuming stalled batches
- Identifies pending/failed keywords
- Triggers background processing
- Updates batch progress

### 4. **`app/components/ZhedoriButtonBar.tsx`** (Modified)
- Added link to `/gazelle_helper`
- Positioned between `/fabric` and `/rankjar`

---

## Database Tables Used

### Primary Table: `zhe_serp_fetch_batches`

**Schema:**
```sql
- batch_id (SERIAL PRIMARY KEY)
- batch_name (VARCHAR)
- batch_source (VARCHAR) -- 'manual-serpjar', 'bulk-kwjar', 'batch-fabric'
- initiated_by_user_id (UUID)
- total_keywords (INTEGER)
- completed_keywords (INTEGER)
- failed_keywords (INTEGER)
- status (VARCHAR) -- 'in_progress', 'completed', 'failed', 'cancelled'
- created_at (TIMESTAMP)
- completed_at (TIMESTAMP)
```

### Supporting Table: `zhe_serp_fetches`

**Key Fields:**
```sql
- fetch_id (INTEGER)
- rel_keyword_id (INTEGER)
- batch_id (INTEGER) -- FK to zhe_serp_fetch_batches
- fetch_source (VARCHAR)
- items_count (TEXT)
- created_at (TIMESTAMP)
```

### Functions Used:
- `update_batch_progress()` - Updates batch status
- Existing functions from batch tracking system

---

## UI Features

### Main Dashboard

**Table Columns:**
1. **Batch ID** - Unique identifier
2. **Batch Name** - Description (e.g., "Gazelle Bulk: 50 keywords")
3. **Source** - Badge showing origin (/kwjar, /serpjar, /fabric)
4. **Status** - Visual badge with status
5. **Progress** - Bar showing completion percentage
6. **Total** - Total keywords in batch
7. **Completed** - Successfully processed keywords (green)
8. **Failed** - Failed keywords (red)
9. **Pending** - Not yet processed (orange)
10. **Started** - Timestamp when batch began
11. **Duration** - Time elapsed since start
12. **Actions** - Resume/Cancel buttons

### Status Badges

| Status | Badge | When Shown |
|--------|-------|------------|
| ⚠️ STALLED | Red | In progress > 30 min with pending keywords |
| 🔄 In Progress | Blue | Currently processing |
| ✅ Completed | Green | All keywords processed successfully |
| ❌ Failed | Red | Batch encountered fatal error |
| 🚫 Cancelled | Gray | User cancelled the batch |

### Source Badges

| Source | Badge Color | Description |
|--------|-------------|-------------|
| bulk-kwjar | Purple | Bulk Gazelle from /kwjar |
| manual-serpjar | Indigo | Single Gazelle from /serpjar |
| batch-fabric | Teal | Batch from /fabric F370 |

### Filters

- **All** - Show all batches
- **⚠️ Stalled** - Only stalled batches (> 30 min with pending)
- **In Progress** - Currently running (not stalled)
- **Completed** - Successfully finished
- **Failed** - Errored out

### Auto-Refresh

- Toggle on/off
- Refreshes every 30 seconds when enabled
- Manual refresh button always available

---

## Stalled Batch Detection

### Criteria for "Stalled":

1. `status = 'in_progress'`
2. `created_at` is more than 30 minutes ago
3. `pending_keywords > 0` (calculated as: total - completed - failed)

### Visual Indicators:

- Red background on table row
- Red progress bar
- ⚠️ STALLED badge
- Resume button appears

---

## Resume Functionality

### How It Works:

1. **User clicks "Resume"** button on stalled batch
2. **Confirmation prompt** shows
3. **API call** to `/api/gazelle-resume`
4. **Backend identifies** failed/pending keywords:
   - Queries `zhe_serp_fetches` for keywords with `items_count = 0` or `NULL`
   - These are keywords that started but didn't complete
5. **Background processing** begins:
   - Runs F400 (LIVE mode) for each keyword
   - Runs F410 (EMD Stamp Match)
   - Runs F420 (Cache Ranking Zones)
   - Updates batch progress after each keyword
6. **Batch completion**:
   - When all keywords processed, marks batch as 'completed' or 'failed'
7. **User notification** confirms resume initiated

### Resume Process Flow:

```
User clicks Resume
    ↓
Confirmation dialog
    ↓
API: /api/gazelle-resume
    ↓
Identify failed keywords
    ↓
For each keyword:
    ├── F400 LIVE SERP Fetch
    ├── F410 EMD Stamp Match
    ├── F420 Cache Ranking Zones
    └── Update batch progress
    ↓
Mark batch as completed/failed
    ↓
Background processing complete
```

### Example Resume Scenario:

**Initial Batch:**
- Total: 100 keywords
- Completed: 45
- Failed: 0
- Pending: 55
- Status: STALLED (running 60 minutes)

**After Resume:**
- Processes remaining 55 keywords
- Updates progress in real-time
- Final status: Completed (95 completed, 5 failed)

---

## API Endpoint Details

### `/api/gazelle-resume`

**Method:** POST

**Request Body:**
```json
{
  "batch_id": 123,
  "user_id": "uuid-string"
}
```

**Response (Success):**
```json
{
  "success": true,
  "message": "Batch resume initiated",
  "batch_id": 123,
  "pending_keywords": 55,
  "note": "Processing will continue in the background"
}
```

**Response (Error):**
```json
{
  "error": "No pending keywords to process",
  "pending_keywords": 0
}
```

### Background Processing:

- Runs asynchronously after API returns
- Uses same Gazelle pipeline (F400 → F410 → F420)
- Always uses **LIVE mode** for F400 (faster, more reliable for resume)
- Updates batch progress after each keyword
- Marks batch complete when done

---

## User Workflow

### Monitoring Workflow:

1. **Navigate** to `/gazelle_helper` via Zhedori nav
2. **View** all recent batches in table
3. **Filter** to see only stalled batches
4. **Monitor** progress with auto-refresh

### Resume Workflow:

1. **Identify** stalled batch (red row, ⚠️ badge)
2. **Click** "Resume" button
3. **Confirm** action in dialog
4. **Wait** for notification that resume started
5. **Monitor** progress as keywords complete
6. **Verify** batch reaches "Completed" status

### Cancel Workflow:

1. **Identify** in-progress batch
2. **Click** "Cancel" button
3. **Confirm** cancellation
4. Batch marked as "Cancelled"
5. No further processing occurs

---

## Technical Details

### Pending Keywords Calculation:

```typescript
const pendingKeywords = batch.total_keywords - batch.completed_keywords - batch.failed_keywords;
```

### Stalled Detection:

```typescript
const isStalled = 
  batch.status === 'in_progress' && 
  durationMinutes > 30 && 
  pendingKeywords > 0;
```

### Progress Percentage:

```typescript
const progressPercent = batch.total_keywords > 0
  ? Math.round(((batch.completed_keywords + batch.failed_keywords) / batch.total_keywords) * 100)
  : 0;
```

### Duration Formatting:

```typescript
const formatDuration = (minutes: number) => {
  if (minutes < 1) return '< 1 min';
  if (minutes < 60) return `${minutes} min`;
  const hours = Math.floor(minutes / 60);
  const mins = minutes % 60;
  return `${hours}h ${mins}m`;
};
```

---

## Performance Considerations

### Auto-Refresh:

- 30-second interval (configurable)
- Can be toggled off to reduce API calls
- Only fetches top 100 batches
- Sorted by most recent first

### Resume Processing:

- Runs in background (non-blocking)
- Processes keywords sequentially (not parallel)
- Uses LIVE mode F400 for reliability (~25 seconds per keyword)
- Progress visible in real-time via auto-refresh

### Database Queries:

**Main query:**
```sql
SELECT * FROM zhe_serp_fetch_batches
ORDER BY created_at DESC
LIMIT 100;
```

**Failed keywords query:**
```sql
SELECT rel_keyword_id, items_count 
FROM zhe_serp_fetches
WHERE batch_id = ?
  AND (items_count = '0' OR items_count IS NULL);
```

---

## Error Handling

### Frontend Errors:

- Failed API calls show error message
- Resume button disabled during processing
- Clear error messages in UI

### Backend Errors:

- Individual keyword failures don't stop batch
- Failed keywords increment `failed_keywords` count
- Batch continues processing remaining keywords
- Final status reflects overall success/failure

### Edge Cases:

1. **No pending keywords:** Shows error, prevents resume
2. **Batch not found:** Returns 404 error
3. **Database connection issues:** Shows error message
4. **API timeout:** User can retry resume

---

## Testing Checklist

### Basic Functionality:
- [ ] Page loads at `/gazelle_helper`
- [ ] Zhedori nav link works
- [ ] Table displays recent batches
- [ ] All columns show correct data
- [ ] Status badges display correctly
- [ ] Source badges show correct origin

### Filtering:
- [ ] "All" filter shows all batches
- [ ] "Stalled" filter shows only stalled
- [ ] "In Progress" shows non-stalled active batches
- [ ] "Completed" shows finished batches
- [ ] "Failed" shows errored batches
- [ ] Filter counts are accurate

### Stalled Detection:
- [ ] Batches > 30 min with pending keywords show as stalled
- [ ] Red background on stalled rows
- [ ] Red progress bars for stalled
- [ ] Resume button appears on stalled batches

### Resume Functionality:
- [ ] Resume button triggers confirmation
- [ ] API call succeeds
- [ ] Background processing starts
- [ ] Progress updates in real-time
- [ ] Batch completes successfully
- [ ] Failed keywords handled gracefully

### Auto-Refresh:
- [ ] Toggle enables/disables auto-refresh
- [ ] Table updates every 30 seconds when enabled
- [ ] Manual refresh button works
- [ ] No refresh when toggle off

### Cancel Functionality:
- [ ] Cancel button appears on in-progress batches
- [ ] Confirmation dialog shows
- [ ] Batch status updates to cancelled
- [ ] No further processing occurs

---

## Use Cases

### Use Case 1: Monitoring Active Batches

**Scenario:** User starts large Gazelle bulk operation from /kwjar

**Steps:**
1. Start Gazelle bulk with 100 keywords on /kwjar
2. Navigate to /gazelle_helper
3. See batch in "In Progress" with live updates
4. Monitor completion percentage
5. Verify batch completes successfully

### Use Case 2: Resuming Stalled Batch

**Scenario:** Batch stalls after processing 40/100 keywords

**Steps:**
1. Notice batch on /kwjar stopped progressing
2. Navigate to /gazelle_helper
3. See batch marked as STALLED (red background)
4. Click "Resume" button
5. Confirm action
6. Monitor as remaining 60 keywords process
7. Batch completes (95 success, 5 failed)

### Use Case 3: Identifying Failed Batches

**Scenario:** Multiple batches running, one fails completely

**Steps:**
1. Open /gazelle_helper
2. Filter by "Failed" status
3. See failed batch with 0 completed, 50 failed
4. Review batch details
5. Decide whether to retry or investigate

### Use Case 4: Cancelling Long-Running Batch

**Scenario:** Accidentally started batch with wrong parameters

**Steps:**
1. Notice batch running on /gazelle_helper
2. Click "Cancel" button
3. Confirm cancellation
4. Batch stops processing
5. Status changes to "Cancelled"

---

## Future Enhancements

**Potential Improvements:**

1. **Detailed Keyword View** - Click batch to see individual keywords
2. **Batch Comparison** - Compare performance across batches
3. **Email Notifications** - Alert when batch stalls
4. **Retry Failed Keywords** - Separate button for only failed keywords
5. **Batch Analytics** - Average success rate, processing time, etc.
6. **Batch Cloning** - Re-run same batch with same parameters
7. **Progress Notifications** - Browser notifications for completion
8. **Export Results** - Download batch results as CSV
9. **Batch Notes** - Add notes/comments to batches
10. **User Filtering** - Filter batches by user who initiated

---

## Integration Points

### Works With:

- ✅ `/kwjar` - Monitors bulk Gazelle operations
- ✅ `/serpjar` - Monitors single Gazelle operations
- ✅ `/fabric` - Monitors F370 batch operations (future)
- ✅ Existing batch tracking system
- ✅ F400, F410, F420 functions

### Database Functions:

- ✅ `create_serp_fetch_batch()` - Already used by /kwjar
- ✅ `update_batch_progress()` - Already used by /kwjar
- ✅ All functions from `add_batch_tracking_and_historical_cache.sql`

---

## Maintenance Notes

### Regular Monitoring:

- Check for batches stalled > 24 hours
- Review failed batch patterns
- Monitor database growth in batch tables

### Database Cleanup:

Consider periodic cleanup of old batches:
```sql
-- Delete batches older than 30 days
DELETE FROM zhe_serp_fetch_batches
WHERE created_at < NOW() - INTERVAL '30 days'
  AND status IN ('completed', 'failed', 'cancelled');
```

### Performance Tuning:

- Limit main query to last 7 days if too slow
- Add pagination if > 1000 batches
- Index optimization if queries slow down

---

## Status: ✅ COMPLETE

Gazelle Helper page is fully implemented and ready to use!

**Summary:**
- ✅ Page created at `/gazelle_helper`
- ✅ Link added to Zhedori navigation
- ✅ Real-time monitoring dashboard
- ✅ Stalled batch detection
- ✅ Resume functionality
- ✅ Cancel functionality
- ✅ Auto-refresh capability
- ✅ Filtering and status badges
- ✅ API endpoint for resume
- ✅ No new database tables needed
- ✅ No linter errors

**Try it now:** Navigate to `/gazelle_helper` to see all your Gazelle batch operations!



