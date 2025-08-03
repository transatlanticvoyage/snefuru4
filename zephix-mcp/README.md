# Zephix MCP Server

A Model Context Protocol (MCP) server for full CRUD operations on Supabase databases.

## Features

- Complete CRUD operations (Create, Read, Update, Delete)
- Batch operations for efficient data manipulation
- Raw SQL query execution
- Schema management (tables, columns, indexes, views)
- Comprehensive audit logging
- Graceful error handling with helpful hints

## Prerequisites

- Node.js 18 or higher
- Supabase project with service role key
- Claude Desktop application

## Installation

1. Clone or navigate to the zephix-mcp directory:
```bash
cd /path/to/localrepo-snefuru4/zephix-mcp
```

2. Install dependencies:
```bash
npm install
```

3. Copy the environment template:
```bash
cp .env.example .env
```

4. Edit `.env` with your Supabase credentials:
```
SUPABASE_URL=https://your-project.supabase.co
SUPABASE_SERVICE_ROLE_KEY=your-service-role-key
```

## Configuration

### Claude Desktop Setup

Add to your Claude Desktop config file:
`~/Library/Application Support/Claude/claude_desktop_config.json`

```json
{
  "mcpServers": {
    "zephix": {
      "command": "node",
      "args": ["/absolute/path/to/zephix-mcp/src/index.js"],
      "env": {
        "NODE_ENV": "production"
      }
    }
  }
}
```

### Create Audit Table (Optional but Recommended)

Run this SQL in your Supabase dashboard:

```sql
CREATE TABLE IF NOT EXISTS zephix_audit_log (
  id UUID PRIMARY KEY DEFAULT gen_random_uuid(),
  operation TEXT NOT NULL,
  table_name TEXT,
  record_id TEXT,
  user_id TEXT DEFAULT 'zephix-mcp',
  timestamp TIMESTAMPTZ DEFAULT NOW(),
  query TEXT,
  params JSONB,
  changes JSONB,
  error JSONB,
  duration_ms INTEGER,
  row_count INTEGER
);

CREATE INDEX idx_zephix_audit_timestamp ON zephix_audit_log(timestamp DESC);
CREATE INDEX idx_zephix_audit_table ON zephix_audit_log(table_name);
CREATE INDEX idx_zephix_audit_operation ON zephix_audit_log(operation);
```

## Available Tools

### Basic CRUD
- `zephix_db_select` - Query rows with filtering and pagination
- `zephix_db_insert` - Insert single row
- `zephix_db_update` - Update rows
- `zephix_db_delete` - Delete rows
- `zephix_db_upsert` - Insert or update on conflict

### Batch Operations
- `zephix_db_insert_many` - Insert multiple rows
- `zephix_db_update_many` - Update multiple rows with different values
- `zephix_db_delete_many` - Delete rows matching various conditions

### Raw SQL
- `zephix_db_query` - Execute SELECT queries
- `zephix_db_execute` - Execute INSERT/UPDATE/DELETE/DDL

### Schema Management
- `zephix_db_create_table` - Create new tables
- `zephix_db_drop_table` - Drop tables
- `zephix_db_add_column` - Add columns
- `zephix_db_drop_column` - Remove columns
- `zephix_db_rename_column` - Rename columns
- `zephix_db_create_index` - Create indexes
- `zephix_db_create_view` - Create views

### Utilities
- `zephix_db_list_tables` - List all tables
- `zephix_db_describe_table` - Get table schema
- `zephix_db_count` - Count rows
- `zephix_db_backup_table` - Export table data

## Usage Examples

### Select with Filtering
```javascript
await zephix_db_select({
  table: "sitespren",
  where: { is_wp_site: true },
  order: ["created_at"],
  limit: 10
})
```

### Insert Data
```javascript
await zephix_db_insert({
  table: "sitespren",
  data: {
    sitespren_base: "example.com",
    is_wp_site: true
  }
})
```

### Update with Conditions
```javascript
await zephix_db_update({
  table: "sitespren",
  data: { is_starred1: "yes" },
  where: { id: "123-456-789" }
})
```

### Batch Insert
```javascript
await zephix_db_insert_many({
  table: "logs",
  data: [
    { message: "Log 1", level: "info" },
    { message: "Log 2", level: "warning" }
  ]
})
```

### Raw SQL Query
```javascript
await zephix_db_query({
  sql: "SELECT * FROM sitespren WHERE created_at > $1",
  params: ["2024-01-01"]
})
```

## Error Handling

Zephix provides detailed error information with helpful hints:

```json
{
  "success": false,
  "error": {
    "code": "42P01",
    "message": "Table does not exist",
    "hint": "Use zephix_db_list_tables to see available tables",
    "operation": "zephix_db_select",
    "params": { "table": "non_existent_table" }
  }
}
```

## Environment Variables

- `SUPABASE_URL` - Your Supabase project URL (required)
- `SUPABASE_SERVICE_ROLE_KEY` - Service role key (required)
- `ZEPHIX_AUDIT_ENABLED` - Enable audit logging (default: true)
- `ZEPHIX_MAX_ROWS` - Maximum rows per query (default: 10000)
- `ZEPHIX_AUDIT_TABLE` - Custom audit table name (default: zephix_audit_log)

## Security Notes

- Uses service role key for full database access
- All operations are logged to audit table
- Sensitive parameters are redacted in error messages
- No RLS enforcement by default (can be added later)

## Troubleshooting

1. **"Missing required environment variable"**
   - Ensure `.env` file exists with correct values

2. **"Table not found" errors**
   - Use `zephix_db_list_tables` to see available tables
   - Check you're using the correct table name

3. **DDL operations return "requires database function"**
   - Some operations need Supabase Edge Functions
   - Use Supabase dashboard for complex DDL

## Future Enhancements

- [ ] Transaction support
- [ ] RLS policy management
- [ ] Backup/restore operations
- [ ] Migration management
- [ ] WordPress site integration