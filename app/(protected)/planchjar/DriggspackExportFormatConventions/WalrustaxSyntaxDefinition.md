# Walrustax Syntax Definition

## Overview
Walrustax is a text formatting convention designed for vertical transposed data that can be easily pasted into CSV files. It presents data in a two-column format where field names and values are separated by whitespace.

## Syntax Pattern

```
field_name  field_value
next_field_name next_field_value
section_header_name
another_field_name  another_field_value
```

## Rules
1. Each line contains either:
   - A field name followed by whitespace (tabs/spaces) and its value
   - A section header with no value (stands alone on its line)
2. Field names and values are separated by one or more tab characters or multiple spaces
3. Section headers (like "phone section", "address section") appear on their own line with no value
4. If a field has no value, only the field name appears on the line
5. The format is optimized for easy CSV import with automatic column separation

## Example Output

```
sitespren_base  raindroplabs.com
driggs_brand_name   Rain Drop Labs
driggs_revenue_goal 2000
phone section
driggs_phone1_platform_id   4
driggs_phone_1  4949489393
address section
driggs_address_full 123 Main St, City, State 12345
driggs_city Ann Arbor
driggs_state_code   MI
```

## CSV Import Behavior
When pasted into a spreadsheet application:
- Column A will contain the field names
- Column B will contain the field values
- Section headers will appear in Column A only
- Empty values will create blank cells in Column B

## Use Cases
- Quick data export for spreadsheet analysis
- CSV file preparation
- Data migration to tabular formats
- Database field review in columnar format