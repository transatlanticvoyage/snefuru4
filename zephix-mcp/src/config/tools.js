export const TOOLS_REGISTRY = {
  // Basic CRUD Operations
  zephix_db_select: {
    description: 'Select rows from a Supabase table with optional filtering',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select (default: *)' },
        where: { type: 'object', description: 'Filter conditions' },
        order: { type: 'array', description: 'Order by columns' },
        limit: { type: 'number', description: 'Maximum rows to return' },
        offset: { type: 'number', description: 'Number of rows to skip' }
      },
      required: ['table']
    }
  },

  zephix_db_insert: {
    description: 'Insert a single row into a Supabase table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'object', description: 'Row data to insert' },
        returning: { type: 'string', description: 'Columns to return after insert' }
      },
      required: ['table', 'data']
    }
  },

  zephix_db_update: {
    description: 'Update rows in a Supabase table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'object', description: 'Data to update' },
        where: { type: 'object', description: 'Filter conditions' },
        returning: { type: 'string', description: 'Columns to return after update' }
      },
      required: ['table', 'data', 'where']
    }
  },

  zephix_db_delete: {
    description: 'Delete rows from a Supabase table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        where: { type: 'object', description: 'Filter conditions' },
        returning: { type: 'string', description: 'Columns to return after delete' }
      },
      required: ['table', 'where']
    }
  },

  zephix_db_upsert: {
    description: 'Insert or update rows based on conflict resolution',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'object', description: 'Data to upsert' },
        onConflict: { type: 'string', description: 'Column(s) for conflict resolution' },
        returning: { type: 'string', description: 'Columns to return' }
      },
      required: ['table', 'data']
    }
  },

  // Batch Operations
  zephix_db_insert_many: {
    description: 'Insert multiple rows in a single operation',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'array', description: 'Array of rows to insert' },
        returning: { type: 'string', description: 'Columns to return' }
      },
      required: ['table', 'data']
    }
  },

  zephix_db_update_many: {
    description: 'Update multiple rows with different values',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        updates: { 
          type: 'array', 
          description: 'Array of {where, data} objects' 
        }
      },
      required: ['table', 'updates']
    }
  },

  zephix_db_delete_many: {
    description: 'Delete multiple rows matching various conditions',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        conditions: { type: 'array', description: 'Array of where conditions' }
      },
      required: ['table', 'conditions']
    }
  },

  // Raw SQL
  zephix_db_query: {
    description: 'Execute a raw SQL query (SELECT)',
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL query to execute' },
        params: { type: 'array', description: 'Query parameters' }
      },
      required: ['sql']
    }
  },

  zephix_db_execute: {
    description: 'Execute a raw SQL command (INSERT, UPDATE, DELETE, DDL)',
    inputSchema: {
      type: 'object',
      properties: {
        sql: { type: 'string', description: 'SQL command to execute' },
        params: { type: 'array', description: 'Command parameters' }
      },
      required: ['sql']
    }
  },

  // Schema Operations
  zephix_db_create_table: {
    description: 'Create a new table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { 
          type: 'array', 
          description: 'Array of column definitions' 
        },
        primaryKey: { type: 'string', description: 'Primary key column(s)' },
        ifNotExists: { type: 'boolean', description: 'Add IF NOT EXISTS clause' }
      },
      required: ['table', 'columns']
    }
  },

  zephix_db_drop_table: {
    description: 'Drop a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        cascade: { type: 'boolean', description: 'Drop dependent objects' },
        ifExists: { type: 'boolean', description: 'Add IF EXISTS clause' }
      },
      required: ['table']
    }
  },

  zephix_db_add_column: {
    description: 'Add a column to an existing table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        column: { type: 'string', description: 'Column name' },
        type: { type: 'string', description: 'Column data type' },
        constraints: { type: 'string', description: 'Column constraints' }
      },
      required: ['table', 'column', 'type']
    }
  },

  zephix_db_drop_column: {
    description: 'Drop a column from a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        column: { type: 'string', description: 'Column name' },
        cascade: { type: 'boolean', description: 'Drop dependent objects' }
      },
      required: ['table', 'column']
    }
  },

  zephix_db_rename_column: {
    description: 'Rename a column',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        oldName: { type: 'string', description: 'Current column name' },
        newName: { type: 'string', description: 'New column name' }
      },
      required: ['table', 'oldName', 'newName']
    }
  },

  zephix_db_create_index: {
    description: 'Create an index on table columns',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Index name' },
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'array', description: 'Column names' },
        unique: { type: 'boolean', description: 'Create unique index' },
        method: { type: 'string', description: 'Index method (btree, hash, gin, gist)' }
      },
      required: ['table', 'columns']
    }
  },

  zephix_db_create_view: {
    description: 'Create a database view',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'View name' },
        query: { type: 'string', description: 'SELECT query for the view' },
        replace: { type: 'boolean', description: 'Replace if exists' }
      },
      required: ['name', 'query']
    }
  },

  // Utility Operations
  zephix_db_list_tables: {
    description: 'List all tables in the database',
    inputSchema: {
      type: 'object',
      properties: {
        schema: { type: 'string', description: 'Schema name (default: public)' },
        includeViews: { type: 'boolean', description: 'Include views in list' }
      }
    }
  },

  zephix_db_describe_table: {
    description: 'Get table schema information',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' }
      },
      required: ['table']
    }
  },

  zephix_db_count: {
    description: 'Count rows in a table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        where: { type: 'object', description: 'Filter conditions' }
      },
      required: ['table']
    }
  },

  zephix_db_backup_table: {
    description: 'Export table data for backup',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        format: { 
          type: 'string', 
          description: 'Export format (json, csv)', 
          enum: ['json', 'csv'] 
        }
      },
      required: ['table']
    }
  }
};