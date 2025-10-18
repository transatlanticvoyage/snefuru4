# 🚀 LeadSmartSkylabTileTables System Plan

**Date:** October 18, 2025  
**Status:** 📋 Planning Phase

---

## 🎯 Goal

Create an independent tile view system for the **Pec Chamber** on both `/leadsmart_tank` and `/leadsmart_morph` pages that:
- Shows the same tile table interface as in FrostySelectorPopup
- Integrates with page-specific filtering (like JettisonTable)
- Allows users to filter the main UI table grid by clicking tiles
- Reuses tile components but in a new context

---

## 📊 Current Architecture

### **FrostySelectorPopup Tile View**
- **Location:** Inside popup's "Tile View" tab
- **Components:**
  - `TileFileReleasesView.tsx` (releases)
  - `TileSubsheetsView.tsx` (subsheets)
  - `TileSubpartsView.tsx` (subparts)
- **Purpose:** Visual selection within popup
- **Context:** Isolated within popup

### **LeadSmartJettisonTable**
- **Location:** Pec Chamber on both pages ✅
- **Purpose:** Filter main table by release/subsheet/subpart
- **Integration:** Config-based (`pageType: 'tank' | 'morph'`)
- **Filtering:** 
  - Tank: Uses `rel_*` columns
  - Morph: Uses `jrel_*` columns

---

## 🏗️ Proposed Architecture

### **LeadSmartSkylabTileTables Component**

**Location:** `app/components/leadsmart/LeadSmartSkylabTileTables.tsx`

**Props:**
```typescript
interface Props {
  pageType: 'tank' | 'morph';
  onFilterApply: (type: 'release' | 'subsheet' | 'subpart', id: number) => void;
  currentFilter?: {
    type: 'release' | 'subsheet' | 'subpart' | null;
    id: number | null;
  };
}
```

**Purpose:**
- Display tile tables in Pec Chamber
- Allow filtering of main UI table grid
- Config-aware (tank vs morph)
- Visually similar to FrostySelectorPopup Tile View

---

## 🔄 Reuse vs Create New

### **Option 1: Reuse Existing Tile Components** ✅ (RECOMMENDED)

**Approach:**
- Import and use existing tile components:
  - `TileFileReleasesView`
  - `TileSubsheetsView`
  - `TileSubpartsView`
- Modify them slightly to support external context (not just within popup)

**Pros:**
- ✅ Code reuse (DRY principle)
- ✅ Consistent UI
- ✅ Single source of truth
- ✅ Easier maintenance

**Cons:**
- ⚠️ Need to make tile components more flexible
- ⚠️ May need slight API changes

---

### **Option 2: Create Independent Versions**

**Approach:**
- Create new versions:
  - `SkylabTileFileReleasesView`
  - `SkylabTileSubsheetsView`
  - `SkylabTileSubpartsView`

**Pros:**
- ✅ Complete independence
- ✅ No risk of breaking popup

**Cons:**
- ❌ Code duplication
- ❌ Double maintenance burden
- ❌ UI consistency harder to maintain

---

## ✅ Recommended Approach: Refactor for Reuse

### **Step 1: Refactor Existing Tile Components**

Make tile components accept optional props for different contexts:

```typescript
interface TileFileReleasesViewProps {
  // Existing props
  onReleaseSelect: (releaseId: number | null) => void;
  selectXType: 'release' | 'subsheet' | 'subpart' | null;
  selectXId: number | null;
  onSelectX: (type: 'release' | 'subsheet' | 'subpart', id: number) => void;
  
  // New optional props for Skylab context
  mode?: 'popup' | 'skylab'; // Default: 'popup'
  onTileClick?: (releaseId: number) => void; // For direct filtering
  highlightedId?: number | null; // For showing current filter
}
```

---

### **Step 2: Create LeadSmartSkylabTileTables Component**

**Structure:**
```typescript
'use client';

import { useState, useEffect } from 'react';
import TileFileReleasesView from '@/app/(protected)/leadsmart_tank/components/TileFileReleasesView';
import TileSubsheetsView from '@/app/(protected)/leadsmart_tank/components/TileSubsheetsView';
import TileSubpartsView from '@/app/(protected)/leadsmart_tank/components/TileSubpartsView';

interface Props {
  pageType: 'tank' | 'morph';
  onFilterApply: (type: 'release' | 'subsheet' | 'subpart', id: number) => void;
  currentFilter?: {
    type: 'release' | 'subsheet' | 'subpart' | null;
    id: number | null;
  };
}

export default function LeadSmartSkylabTileTables({ 
  pageType, 
  onFilterApply,
  currentFilter 
}: Props) {
  const [selectedReleaseId, setSelectedReleaseId] = useState<number | null>(null);
  const [selectedSubsheetId, setSelectedSubsheetId] = useState<number | null>(null);
  
  const handleTileClick = (type: 'release' | 'subsheet' | 'subpart', id: number) => {
    // Apply filter to main table
    onFilterApply(type, id);
  };
  
  return (
    <div className="p-4">
      <div className="mb-2 font-bold text-gray-700">
        Skylab Tile Filter - {pageType === 'tank' ? 'Tank' : 'Morph'} Page
      </div>
      
      <TileFileReleasesView
        onReleaseSelect={setSelectedReleaseId}
        selectXType={currentFilter?.type || null}
        selectXId={currentFilter?.id || null}
        onSelectX={handleTileClick}
        mode="skylab"
        highlightedId={currentFilter?.type === 'release' ? currentFilter.id : null}
      />
      
      <TileSubsheetsView
        selectedReleaseId={selectedReleaseId}
        onSubsheetSelect={setSelectedSubsheetId}
        selectXType={currentFilter?.type || null}
        selectXId={currentFilter?.id || null}
        onSelectX={handleTileClick}
        mode="skylab"
        highlightedId={currentFilter?.type === 'subsheet' ? currentFilter.id : null}
      />
      
      <TileSubpartsView
        selectedSubsheetId={selectedSubsheetId}
        onSubpartSelect={() => {}}
        selectXType={currentFilter?.type || null}
        selectXId={currentFilter?.id || null}
        onSelectX={handleTileClick}
        mode="skylab"
        highlightedId={currentFilter?.type === 'subpart' ? currentFilter.id : null}
      />
    </div>
  );
}
```

---

### **Step 3: Integration in Tank Page**

**File:** `app/(protected)/leadsmart_tank/pclient.tsx`

```typescript
import LeadSmartSkylabTileTables from '@/app/components/leadsmart/LeadSmartSkylabTileTables';

// Add state for Skylab filter
const [skylabFilter, setSkylabFilter] = useState<{
  type: 'release' | 'subsheet' | 'subpart' | null;
  id: number | null;
}>({ type: null, id: null });

// Handler for Skylab filter
const handleSkylabFilterApply = (type: 'release' | 'subsheet' | 'subpart', id: number) => {
  setSkylabFilter({ type, id });
  // This will trigger table refresh via jettisonFilter or similar mechanism
};

// In Pec Chamber
{pecChamberVisible && (
  <div className="...">
    <h3>Skylab Tile System</h3>
    <LeadSmartSkylabTileTables
      pageType="tank"
      onFilterApply={handleSkylabFilterApply}
      currentFilter={skylabFilter}
    />
  </div>
)}
```

---

### **Step 4: Integration in Morph Page**

**File:** `app/(protected)/leadsmart_morph/pclient.tsx`

```typescript
import LeadSmartSkylabTileTables from '@/app/components/leadsmart/LeadSmartSkylabTileTables';

// Same pattern as tank page, but with pageType="morph"
<LeadSmartSkylabTileTables
  pageType="morph"
  onFilterApply={handleSkylabFilterApply}
  currentFilter={skylabFilter}
/>
```

---

## 🔄 Filtering Logic

### **Tank Page (`leadsmart_zip_based_data`)**

When user clicks a tile in Skylab:
```typescript
// Filter by release
WHERE rel_release_id = selectedReleaseId

// Filter by subsheet
WHERE rel_subsheet_id = selectedSubsheetId

// Filter by subpart
WHERE rel_subpart_id = selectedSubpartId
```

---

### **Morph Page (`leadsmart_transformed`)**

When user clicks a tile in Skylab:
```typescript
// Filter by release
WHERE jrel_release_id = selectedReleaseId

// Filter by subsheet
WHERE jrel_subsheet_id = selectedSubsheetId

// Filter by subpart
WHERE jrel_subpart_id = selectedSubpartId
```

---

## 🎨 UI Differences: Popup vs Skylab

| Aspect | FrostySelectorPopup | LeadSmartSkylabTileTables |
|--------|---------------------|---------------------------|
| **Location** | Inside popup, Tile View tab | Pec Chamber on main page |
| **Purpose** | Visual selection for transform | Filter main UI table grid |
| **SX Click** | Activates select_x system | Filters main table |
| **VC Click** | Shows children (hierarchy) | Same (shows children) |
| **Context** | Isolated popup state | Shared page state |
| **Visibility** | Only when popup open | Always visible when pec chamber open |

---

## 📊 Behavior Comparison

### **FrostySelectorPopup (Current)**
```
User Flow:
1. Click "selector popup" button
2. Switch to "Tile View" tab
3. Click sx on a tile
4. Use right pane actions (delete/transform/filter)
5. Close popup
```

### **LeadSmartSkylabTileTables (New)**
```
User Flow:
1. Skylab always visible in Pec Chamber
2. Click any tile (sx button)
3. Main UI table grid filters instantly
4. Continue working with filtered data
5. Click different tile to change filter
```

---

## 🔧 Implementation Phases

### **Phase 1: Refactor Tile Components** ⏳
- Add `mode` prop to tile components
- Add `highlightedId` prop for showing active filter
- Add `onTileClick` optional handler
- Maintain backward compatibility

### **Phase 2: Create LeadSmartSkylabTileTables** ⏳
- Build component structure
- Import and use refactored tile components
- Handle filter state management
- Add config-based logic (tank vs morph)

### **Phase 3: Integrate in Tank Page** ⏳
- Add to Pec Chamber
- Connect filter handler
- Test filtering with `rel_*` columns

### **Phase 4: Integrate in Morph Page** ⏳
- Add to Pec Chamber
- Connect filter handler
- Test filtering with `jrel_*` columns

### **Phase 5: Polish & Test** ⏳
- Visual styling consistency
- Clear filter button
- Active state indicators
- Performance optimization

---

## 🎯 Key Features

### **1. Live Filtering**
- Click tile → main table filters instantly
- No need to open popup
- Quick access to filtered views

### **2. Hierarchical Navigation**
- VC buttons work same as popup
- Release → Subsheets → Subparts
- Visual hierarchy maintained

### **3. Clear Visual Feedback**
- Active filter highlighted
- Count badges show children
- Color-coded states (blue/green)

### **4. Config-Based**
- Tank page: `rel_*` columns
- Morph page: `jrel_*` columns
- Same component, different behavior

---

## 🔄 Data Flow

```
┌─────────────────────────────────────────────┐
│         LeadSmartSkylabTileTables           │
│  (Pec Chamber)                              │
├─────────────────────────────────────────────┤
│  ┌────────────────────────────────────┐    │
│  │ User clicks tile (sx button)       │    │
│  └────────────┬───────────────────────┘    │
│               │                             │
│               ↓                             │
│  ┌────────────────────────────────────┐    │
│  │ onFilterApply(type, id)            │    │
│  └────────────┬───────────────────────┘    │
└───────────────┼─────────────────────────────┘
                │
                ↓
┌───────────────────────────────────────────────┐
│  Parent Page (tank or morph)                  │
├───────────────────────────────────────────────┤
│  setSkylabFilter({ type, id })                │
│  ↓                                            │
│  Main UI Table (LeadsmartTankTable or Morph)  │
│  Receives filter prop                         │
│  ↓                                            │
│  SQL Query with WHERE clause:                 │
│  - Tank: WHERE rel_[type]_id = id            │
│  - Morph: WHERE jrel_[type]_id = id          │
│  ↓                                            │
│  Filtered data displayed                      │
└───────────────────────────────────────────────┘
```

---

## 📝 Benefits

| Benefit | Description |
|---------|-------------|
| **Quick Filtering** | No popup needed, filter from pec chamber |
| **Code Reuse** | Same tile components as popup |
| **Consistent UX** | Same interaction patterns |
| **Config-Based** | Works on both tank and morph pages |
| **Visual Hierarchy** | Maintains parent-child relationships |
| **Compact Display** | Efficient use of pec chamber space |

---

## ⚠️ Considerations

### **1. State Management**
- Skylab filter separate from Jettison filter
- Or unified filter system?
- **Recommendation:** Unified filter (replace Jettison with Skylab)

### **2. Performance**
- Fetching counts for all tiles
- Could be hundreds of entities
- **Solution:** Same optimization as popup (parallel fetches, head-only queries)

### **3. Visual Space**
- Pec chamber may have limited height
- Many tiles might overflow
- **Solution:** Scrollable container, similar to popup

### **4. Clear Filter**
- Need easy way to remove filter
- **Solution:** "Clear Filter" button or click active tile again

---

## 🎯 Next Steps

1. **Decide:** Refactor tile components for reuse? ✅ Recommended
2. **Build:** LeadSmartSkylabTileTables component
3. **Integrate:** Add to Pec Chamber on both pages
4. **Test:** Verify filtering works correctly
5. **Polish:** Visual consistency and UX refinements

---

## 📂 File Structure

```
app/
├── components/
│   └── leadsmart/
│       ├── LeadSmartJettisonTable.tsx ✅ (moved)
│       └── LeadSmartSkylabTileTables.tsx ✅ (created, blank)
│
└── (protected)/
    └── leadsmart_tank/
        └── components/
            ├── TileFileReleasesView.tsx (will refactor)
            ├── TileSubsheetsView.tsx (will refactor)
            └── TileSubpartsView.tsx (will refactor)
```

---

## ✅ Status

**Current:**
- ✅ LeadSmartJettisonTable moved to `app/components/leadsmart/`
- ✅ All imports updated
- ✅ LeadSmartSkylabTileTables.tsx created (blank)
- ✅ Plan documented

**Next:**
- ⏳ Refactor tile components for reuse
- ⏳ Build LeadSmartSkylabTileTables component
- ⏳ Integrate in tank page
- ⏳ Integrate in morph page
- ⏳ Test and polish

Ready to proceed with implementation! 🚀

