# Mud System Documentation

## Overview

The Mud System is the core data architecture for the `/mesagen` page, providing a line-based content editing system where each line of content is stored as an individual database record. This system enables granular content management while maintaining relationships between static snapshots and live editable content.

## Database Tables & Relationships

### Primary Tables

#### `gcon_pieces` (Content Container)
```
- id (uuid) - Primary key
- fk_users_id (uuid) - Owner reference
- mud_content (text) - Static F22 snapshot (IMMUTABLE)
- mud_document (text) - Live compiled HTML from mud_deplines
- mud_title (text) - Content title
- [other fields...]
```

#### `mud_deplines` (Line-Based Content Storage)
```
- depline_id (uuid) - Primary key
- fk_gcon_piece_id (uuid) - References gcon_pieces.id
- depline_jnumber (integer) - Line sequence order (1, 2, 3...)
- depline_knumber (integer) - Reserved for future use
- content_raw (text) - HTML content for this line
- html_tags_detected (text) - Comma-separated list of HTML tags
- created_at (timestamp) - Creation timestamp
```

### Data Flow Architecture

```
F22 Process → gcon_pieces.mud_content (static snapshot)
     ↓
mud_deplines ← (source of truth for editing)
     ↓
gcon_pieces.mud_document ← (live compiled output)
```

## Content Types & Relationships

### 1. `gcon_pieces.mud_content` 
- **Source**: F22 processing system
- **Nature**: Static snapshot from original content processing
- **Mutability**: IMMUTABLE - never updated after F22 processing
- **Purpose**: Historical reference and fallback for initialization

### 2. `mud_deplines` Table
- **Source**: User editing via depline editors
- **Nature**: Line-based editable source of truth
- **Mutability**: FULLY EDITABLE - primary editing interface
- **Purpose**: Granular content management, per-line editing

### 3. `gcon_pieces.mud_document`
- **Source**: Compiled from `mud_deplines.content_raw` fields
- **Nature**: Live-generated composite document
- **Mutability**: AUTO-GENERATED on save operations
- **Purpose**: Complete HTML document representation

## Glossary

### Depline Editor
A single Tiptap editor instance representing one row in the `mud_deplines` table. Each depline editor:
- Maps to exactly one `mud_deplines` record
- Contains HTML content in its `content_raw` field
- Has a specific position via `depline_jnumber`

### Depline System / Multi-line Tiptap Editor
The complete collection of depline editors working together as a cohesive editing interface. Provides:
- Sequential line editing
- Automatic line numbering via `depline_jnumber`
- Cross-line operations (Enter/Backspace behavior)

### Line Sequencing Logic

#### `depline_jnumber` Management
- **Sequential Ordering**: Lines are numbered 1, 2, 3, 4...
- **Gap Prevention**: No gaps allowed in sequence
- **Reindexing**: When lines are added/removed, all subsequent lines are renumbered
- **Database Consistency**: `depline_jnumber` always reflects current UI order

#### Operations Impact on Sequencing
- **Insert Line**: Increment all subsequent `depline_jnumber` values
- **Delete Line**: Decrement all subsequent `depline_jnumber` values  
- **Save Operation**: Verify sequence integrity before database commit

## Data Integrity Rules

### Source of Truth Hierarchy
1. **PRIMARY**: `mud_deplines` table - editable source of truth
2. **DERIVED**: `gcon_pieces.mud_document` - auto-generated composite
3. **HISTORICAL**: `gcon_pieces.mud_content` - immutable F22 snapshot

### Content Preservation
- `content_raw` fields maintain exact HTML structure
- No automatic tag injection or stripping
- HTML tags detected and cataloged in `html_tags_detected`
- Original formatting preserved through save/load cycles

### Relationship Constraints
- All `mud_deplines` records MUST reference valid `gcon_pieces.id`
- `depline_jnumber` sequence MUST be continuous (no gaps)
- `mud_document` MUST reflect concatenated `content_raw` in `depline_jnumber` order

## System Behavior

### Initialization Priority
1. Check for existing `mud_deplines` records
2. If found: Create depline editors from `mud_deplines` data
3. If none: Fallback to parsing `gcon_pieces.mud_content`

### Save Operation Flow
1. Collect all depline editor content
2. Clean unwanted auto-generated `<p>` wrappers
3. Save to `mud_deplines` with proper `depline_jnumber` sequence
4. Concatenate all `content_raw` fields in order
5. Store result in `gcon_pieces.mud_document`

### Content Compilation
```
mud_document = mud_deplines
  .sort_by(depline_jnumber)
  .map(content_raw)
  .join('\n')
```

## Important Warnings

⚠️ **NEVER modify `gcon_pieces.mud_content`** - This field is immutable after F22 processing

⚠️ **NEVER break `depline_jnumber` sequence** - Must maintain continuous numbering

⚠️ **NEVER auto-inject HTML tags** - Content preservation is critical

⚠️ **ALWAYS verify sequence integrity** - Before any database operations involving line order