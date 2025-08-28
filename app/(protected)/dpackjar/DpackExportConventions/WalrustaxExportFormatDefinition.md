# Walrustax Export Format Definition

## Overview
Walrustax is a format designed for vertical transposed CSV data, optimized for pasting into spreadsheet applications as two columns (field name and field value).

## Format Structure

### Two-Column Layout:
```
field_name1    field_value1
field_name2    field_value2
field_name3    field_value3
```

## Implementation Rules

1. **Column Separation**: Use tab characters (`\t`) or multiple spaces for proper column alignment
2. **Field Name**: Left column contains the exact field name as defined in the database
3. **Field Value**: Right column contains the actual value from the database
4. **Empty Values**: Empty/null values result in blank right column
5. **Section Headers**: Section headers appear as field names with empty values in right column
6. **No Headers**: No column headers are included (ready for direct paste)

## Data Source
- Primary data comes from the `sitespren` table  
- Filtered by current user's ID (`fk_users_id`)
- Matched by the `site` URL parameter (`sitespren_base` field)
- Fields extracted according to the `dpack_datum` field definition list

## Field Order
Fields are displayed in the exact order as defined in the `dpack_datum` field from the corresponding `driggs_packs` record.

## Usage Scenario
This format is specifically designed for:
- Pasting into Excel/Google Sheets as two columns
- CSV import operations
- Data transfer between systems
- Quick data review in tabular format

## Special Handling
- Tab-separated for optimal spreadsheet compatibility
- No quotation marks or escaping (plain text format)
- Each line represents one field/value pair
- Section headers create logical groupings with blank values