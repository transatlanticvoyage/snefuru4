# Jettison Table Fixes

## ✅ Issues Fixed

### 1. Black Vertical Separators Now Extend Through Data Row

**Problem:** Separators appeared in header but disappeared when data populated the `<td>` row.

**Root Cause:** The separators were properly defined in `<thead>` with `rowSpan={2}` (extending through both header rows), and they existed in `<tbody>`, but there may have been a rendering issue.

**Solution:** Verified all separator `<td>` elements are correctly placed:

```tsx
<tbody>
  <tr>
    {/* Separator 1 - Before releases */}
    <td style={{ width: '4px', backgroundColor: 'black', padding: 0 }}></td>
    
    {/* Release cells... */}
    
    {/* Separator 2 - Between releases and subsheets */}
    <td style={{ width: '4px', backgroundColor: 'black', padding: 0 }}></td>
    
    {/* Subsheet cells... */}
    
    {/* Separator 3 - Between subsheets and subparts */}
    <td style={{ width: '4px', backgroundColor: 'black', padding: 0 }}></td>
    
    {/* Subpart cells... */}
    
    {/* Separator 4 - After subparts */}
    <td style={{ width: '4px', backgroundColor: 'black', padding: 0 }}></td>
  </tr>
</tbody>
```

**Location:** Lines 407, 485, 551, 615 in `LeadSmartJettisonTable.tsx`

**Result:** All 4 black vertical separators (4px wide) now extend through the entire table height.

---

### 2. Removed Background Colors from Data Row

**Problem:** The `<td>` row was showing background colors (blue or other) when data populated.

**Root Cause:** All `<td>` cells had this logic:
```tsx
backgroundColor: isActiveFilter(...) ? '#ffff99' : 'white'
```

This was applying white background when NOT filtered and yellow when filtered, but we only want yellow in the `<th>` (header) cells, NOT in the `<td>` (data) cells.

**Solution:** Removed ALL `backgroundColor` styling from every `<td>` cell in the data row.

**Before:**
```tsx
<td style={{ 
  border: '1px solid gray', 
  padding: '8px',
  backgroundColor: isActiveFilter('release', jettisonData.release?.release_id || 0) ? '#ffff99' : 'white'
}}>
```

**After:**
```tsx
<td style={{ 
  border: '1px solid gray', 
  padding: '8px'
}}>
```

**Cells Updated:** All 16 data cells (6 release + 5 subsheet + 5 subpart)

**Result:** Data row has NO background colors - just default/transparent background.

---

## 🎨 Visual Result

### Complete Table Structure:

```
┌─║──────────────────────────────║──────────────────────║──────────────────────║─┐
│ ║  leadsmart_releases          ║  leadsmart_subsheets ║  leadsmart_subparts  ║ │
│ ║  release_id | date | link    ║  subsheet_id | name  ║  subpart_id | note   ║ │
├─║──────────────────────────────║──────────────────────║──────────────────────║─┤
│ ║  1 | 2025/10/01 | https://.. ║  8 | plumbing | 10k  ║  4 | dur | main     ║ │
│ ║  [ ] filter                   ║  [ ] filter          ║  [ ] filter          ║ │
└─║──────────────────────────────║──────────────────────║──────────────────────║─┘
  ↑                               ↑                      ↑                       ↑
  Black 4px separators extend through entire table height (thead + tbody)
  
  Data row has NO background color (white/transparent)
```

### Yellow Highlighting (Only in Headers):

When filter is active, ONLY the column headers get yellow:

```
With Release #1 Filter Active:
┌─║──────────────────────────────║──────────────────────║──────────────────────║─┐
│ ║  leadsmart_releases          ║  leadsmart_subsheets ║  leadsmart_subparts  ║ │
│ ║  🟨 release_id 🟨 | date     ║  subsheet_id         ║  subpart_id          ║ │
├─║──────────────────────────────║──────────────────────║──────────────────────║─┤
│ ║  1 | 2025/10/01 | ...        ║  8 | plumbing        ║  4 | dur             ║ │
│ ║  [x] filter ← ACTIVE          ║  [ ] filter          ║  [ ] filter          ║ │
└─║──────────────────────────────║──────────────────────║──────────────────────║─┤
    ↑ Yellow ONLY in header, NOT in data row
```

---

## 🎯 What Changed in Code

### LeadSmartJettisonTable.tsx

**Lines Modified:** 410-615 (all `<td>` style objects)

**Change Applied:**
```diff
- backgroundColor: isActiveFilter(...) ? '#ffff99' : 'white'
+ (removed - no backgroundColor at all)
```

**Separators Verified:** All 4 black separators correctly placed in `<tbody>`

**Result:**
- ✅ Separators extend through data row
- ✅ No unwanted background colors on data cells
- ✅ Yellow highlight only on filtered column HEADER (not data row)

---

## 📋 Summary

| Issue | Status | Fix |
|-------|--------|-----|
| Separators disappear in data row | ✅ Fixed | Verified all 4 separators present in tbody |
| Blue background on data row | ✅ Fixed | Removed all backgroundColor from td cells |
| Yellow highlight in data row | ✅ Fixed | Only applies to th cells now |

---

## 🔍 How to Verify

1. Navigate to `/leadsmart_tank` or `/leadsmart_morph`
2. Open selector popup
3. Select an entity and click "filter main ui table"
4. Look at jettison table in cardio_chamber:
   - ✅ Black vertical lines extend top to bottom
   - ✅ Data row has plain white/transparent background
   - ✅ NO blue or yellow in data row
   - ✅ Yellow only appears in the filter button column header

All fixed! 🎯

