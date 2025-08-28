# Sharkintax Syntax Definition

## Overview
Sharkintax is a text formatting convention that uses equal signs (=) and hyphens (-) as separators to create a structured, readable output format for database field data.

## Syntax Pattern

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

## Rules
1. Each field section starts and ends with a line of exactly 35 equal signs (=)
2. The field name is placed on its own line between equal sign separators
3. A line of exactly 35 hyphens (-) separates the field name from its value
4. The field value is placed on its own line after the hyphen separator
5. If a field has no value, the value line should be left empty
6. Section headers (like "phone section", "address section") are treated as field names but have no value line

## Example Output

```
===================================
sitespren_base
-----------------------------------
treeserviceannarbor.com
===================================
driggs_brand_name
-----------------------------------
Tree Service Ann Arbor
===================================
driggs_revenue_goal
-----------------------------------
150
===================================
phone section
-----------------------------------

===================================
driggs_phone1_platform_id
-----------------------------------
4
===================================
driggs_phone_1
-----------------------------------
7348879477
===================================
```

## Use Cases
- Data export for human-readable review
- Template generation for data migration
- Structured data display in code editors
- Debug output formatting