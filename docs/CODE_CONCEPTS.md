# Code Concepts & Definitions

This document contains custom terminology and concepts used throughout the Snefuru codebase.

## UI Table Concepts

### prisomi_ (Prisomi Column)

**Type**: UI Interface Pattern  
**Category**: Table Grid Numbering  
**First Defined**: 2025-06-29  

**Definition**:  
A **prisomi column** is a dynamically generated row numbering column that appears at the far left of UI table grids. It provides continuous numbering across ALL table rows, including both header (`<th>`) and data (`<td>`) rows.

**Key Characteristics**:
- Displays sequential numbers starting from 1
- Counts ALL `<tr>` elements (both in `<thead>` and `<tbody>`)
- Updates automatically when header rows are added/removed
- Exists only in the UI layer (not stored in database)
- Used for absolute row referencing in complex table layouts

**Example**:
```
prisomi | Column A | Column B
--------|----------|----------
1       | Header 1 | Header 1   <- <thead> row 1
2       | Header 2 | Header 2   <- <thead> row 2  
3       | Data A   | Data B     <- <tbody> row 1
4       | Data C   | Data D     <- <tbody> row 2
```

**Usage Context**:
- `/edable` editor tables
- Any complex table with multiple header rows
- When absolute row positioning reference is needed

**Related Concepts**:
- `lineyoshi` - content-only line numbering (different from prisomi)

---

## Naming Conventions

### Dorli System

**Type**: Content Preservation System  
**Category**: HTML Block Extraction  
**First Defined**: 2025-06-29  

**Definition**:
The **dorli system** extracts complex multi-line HTML structures (tables, forms, divs) from content during normalization, stores them separately in the `aval_dorlis` table, and replaces them with placeholders like `{{DORLI:TABLE:0}}`.

**Key Components**:
- `aval_dorlis` table - stores extracted HTML blocks
- `{{DORLI:TAG:N}}` placeholders - reference stored blocks
- `DorliEditor` component - specialized editor for dorli blocks

---

## Database Concepts

### aval_ prefix

**Type**: Database Naming Convention  
**Category**: Table/Column Naming  
**First Defined**: Prior to 2025-06  

**Definition**:
The **aval_** prefix indicates "available" or "active value" fields/tables that contain the current working version of content, as opposed to cached or historical versions.

**Examples**:
- `aval_content` - active content field
- `aval_title` - active title field  
- `aval_dorlis` - active dorli blocks table

---

## Add New Concepts Below
<!-- Template:
### concept_name

**Type**: [UI Pattern | Database Convention | System | etc.]  
**Category**: [Specific area]  
**First Defined**: YYYY-MM-DD  

**Definition**:  
[Clear explanation]

**Key Characteristics**:
- [Bullet points]

**Usage Context**:
- [Where/when to use]

**Related Concepts**:
- [Links to related terms]
-->