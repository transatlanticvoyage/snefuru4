# Sharkintax Export Format Definition

## Overview
Sharkintax is a format for exporting data with clear visual separators using equal signs and hyphens. It's designed for human readability and clear field delineation.

## Format Structure

### Field Separator Pattern:
```
===================================
field_name
-----------------------------------
field_value
===================================
next_field_name
-----------------------------------
next_field_value
===================================
```

## Implementation Rules

1. **Header Separator**: 35 equal signs (`=`) above each field name
2. **Field Name**: Display the exact field name as defined in the database
3. **Value Separator**: 35 hyphens (`-`) below the field name and above the value
4. **Field Value**: Display the actual value from the database (empty line if null/empty)
5. **No trailing separator**: The format ends after the last field value

## Data Source
- Primary data comes from the `sitespren` table
- Filtered by current user's ID (`fk_users_id`)
- Matched by the `site` URL parameter (`sitespren_base` field)
- Fields extracted according to the `dpack_datum` field definition list

## Field Order
Fields are displayed in the exact order as defined in the `dpack_datum` field from the corresponding `driggs_packs` record.

## Special Handling
- Empty/null values display as empty lines between separators
- Section headers (like "phone section", "address section") are treated as regular fields
- All field names are displayed exactly as they appear in the field list