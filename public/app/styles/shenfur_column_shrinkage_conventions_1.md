# Column Shrinkage Conventions for LeadSmart Morph Table

## Overview
This document describes the CSS conventions and techniques used to create narrow, space-efficient columns in the LeadSmart Morph table interface. These conventions allow certain columns to shrink to their minimum necessary width while maintaining readability and functionality.

## Core Principle
The width of each column is determined by the `<td>` content (data cells), not the `<th>` content (header cells). Header cells that overflow are hard-clipped to match the column width established by the data cells.

## Target Columns
The following columns receive narrow width treatment:
- `__abstract_checkbox` (checkbox column)
- `mundial_id`
- `baobab_attempt_id`
- `jrel_release_id`
- `jrel_subsheet_id`
- `jrel_subpart_id`
- `city_name`
- `state_code`
- `payout`
- `fk_city_id`
- `city_population`
- `multiplied_payout_by_population`

## CSS Classes Structure
All targeted columns use the class pattern: `.for_db_column_[column_name]`

## Width Control Rules

### 1. Column Level Settings
```css
.leadsmart-morph-main-table .for_db_column_[name] {
  width: 1px !important;        /* Forces column to minimum needed width */
  white-space: nowrap !important; /* Prevents text wrapping */
}
```

### 2. Special Checkbox Column Constraint
```css
.leadsmart-morph-main-table .for_db_column__abstract_checkbox {
  width: 1px !important;
  max-width: 60px !important;   /* Additional constraint for checkbox column */
}
```

## Cell Content Rules

### TD Cells (Data Cells) - Determine Natural Width
**Purpose**: TD cells establish the actual column width based on their content.

```css
.leadsmart-morph-main-table td.for_db_column_[name] .cell_inner_wrapper_div {
  white-space: nowrap !important;     /* Prevent wrapping - show full content */
  padding: 4px 8px !important;        /* Consistent padding */
  min-width: fit-content !important;  /* Ensure content fits */
  text-align: left !important;        /* Left-align all content */
  justify-content: flex-start !important;
  display: block !important;
}
```

**Checkbox TD Special Case**:
```css
.leadsmart-morph-main-table td.for_db_column__abstract_checkbox .cell_inner_wrapper_div {
  padding: 4px !important;            /* Minimal padding for checkbox */
}
```

### TH Cells (Header Cells) - Overflow Handling with Hard Cutoff
**Purpose**: TH cells are constrained to the width established by TD cells, with overflow text hard-clipped.

```css
.leadsmart-morph-main-table th.for_db_column_[name] {
  position: relative !important;
  overflow: hidden !important;        /* Cut off overflowing content */
  max-width: 0 !important;            /* Force to minimum width */
  width: 1px !important;
}

.leadsmart-morph-main-table th.for_db_column_[name] .cell_inner_wrapper_div {
  white-space: nowrap !important;     /* Single line only */
  overflow: hidden !important;        /* Hide overflow */
  text-overflow: clip !important;     /* Hard cutoff, NOT ellipsis */
  display: block !important;
  padding: 4px 8px !important;        /* Match TD padding */
  min-width: 0 !important;           /* Allow shrinking */
}
```

## Z-Index Layering System
**Purpose**: Ensures cells on the right properly overlay cells on the left when content might overlap.

Progressive z-index values from left to right:
```css
th.for_db_column_mundial_id, td.for_db_column_mundial_id { z-index: 1; }
th.for_db_column_baobab_attempt_id, td.for_db_column_baobab_attempt_id { z-index: 2; }
th.for_db_column_jrel_release_id, td.for_db_column_jrel_release_id { z-index: 3; }
/* ... continues incrementally for each column ... */
th.for_db_column_payout, td.for_db_column_payout { z-index: 9; }
th.for_db_column_fk_city_id, td.for_db_column_fk_city_id { z-index: 10; }
```

**Required for z-index to work**:
```css
.for_db_column_[name] {
  position: relative;
}
```

## Tooltip System for Truncated Headers
Since header text is hard-clipped, a tooltip system shows the full column name on click:

```css
.shenfur_db_table_name_tr th.for_db_column_[name] {
  cursor: pointer;  /* Indicates clickable for tooltip */
}
```

## Key Implementation Details

### 1. Width Determination Flow
1. TD cells render with `white-space: nowrap` to show full content
2. This establishes the natural column width
3. TH cells are then constrained to match this width
4. Overflow in TH cells is hard-clipped (not ellipsis)

### 2. Text Overflow Handling
- **TD cells**: Never truncate - always show full content
- **TH cells**: Hard clip with `text-overflow: clip` (not `ellipsis`)
- **Reason**: Clean visual cutoff without "..." dots

### 3. Alignment Rules
- All narrow columns use left alignment
- Exception: Checkbox column maintains center alignment
- Achieved through `text-align: left` and `justify-content: flex-start`

### 4. The `cell_inner_wrapper_div` Pattern
All content inside TH and TD cells is wrapped in a div with class `cell_inner_wrapper_div`. This allows:
- Consistent padding application
- Proper text overflow control
- Alignment management
- Separation of cell styling from content styling

## Visual Result
- Columns shrink to minimum width needed for their data
- Headers that don't fit are cleanly cut off
- No wasted horizontal space
- Clean, dense table layout
- Tooltips provide full header text when needed

## Important Notes
1. The `!important` flag is used throughout to override any inline styles
2. The `.leadsmart-morph-main-table` parent class ensures these rules only apply to the specific table
3. The system relies on the `for_db_column_` class naming convention
4. Z-index layering prevents visual glitches when cells might overlap
5. The hard clip (not ellipsis) creates a cleaner visual appearance for truncated headers