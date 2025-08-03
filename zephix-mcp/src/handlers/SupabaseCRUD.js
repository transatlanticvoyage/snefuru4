import { createClient } from '@supabase/supabase-js';

export class SupabaseCRUD {
  constructor({ url, serviceKey }) {
    this.supabase = createClient(url, serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });
    this.maxRows = parseInt(process.env.ZEPHIX_MAX_ROWS || '10000');
  }

  // Basic CRUD Operations
  async select({ table, columns = '*', where = {}, order = [], limit, offset }) {
    let query = this.supabase.from(table).select(columns);

    // Apply filters
    for (const [key, value] of Object.entries(where)) {
      if (value === null) {
        query = query.is(key, null);
      } else if (typeof value === 'object' && value.op) {
        // Advanced operators: {op: 'gt', value: 10}
        query = this.applyOperator(query, key, value);
      } else {
        query = query.eq(key, value);
      }
    }

    // Apply ordering
    for (const orderItem of order) {
      if (typeof orderItem === 'string') {
        query = query.order(orderItem);
      } else {
        query = query.order(orderItem.column, { ascending: orderItem.ascending ?? true });
      }
    }

    // Apply pagination
    if (limit) query = query.limit(Math.min(limit, this.maxRows));
    if (offset) query = query.range(offset, offset + (limit || this.maxRows) - 1);

    const { data, error } = await query;
    
    if (error) throw this.formatError(error);
    return data;
  }

  async insert({ table, data, returning = '*' }) {
    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select(returning);

    if (error) throw this.formatError(error);
    return result;
  }

  async update({ table, data, where, returning = '*' }) {
    let query = this.supabase.from(table).update(data);

    // Apply filters
    for (const [key, value] of Object.entries(where)) {
      query = query.eq(key, value);
    }

    const { data: result, error } = await query.select(returning);

    if (error) throw this.formatError(error);
    return result;
  }

  async delete({ table, where, returning = '*' }) {
    let query = this.supabase.from(table).delete();

    // Apply filters
    for (const [key, value] of Object.entries(where)) {
      query = query.eq(key, value);
    }

    const { data: result, error } = await query.select(returning);

    if (error) throw this.formatError(error);
    return result;
  }

  async upsert({ table, data, onConflict, returning = '*' }) {
    const options = onConflict ? { onConflict } : {};
    
    const { data: result, error } = await this.supabase
      .from(table)
      .upsert(data, options)
      .select(returning);

    if (error) throw this.formatError(error);
    return result;
  }

  // Batch Operations
  async insertMany({ table, data, returning = '*' }) {
    if (!Array.isArray(data)) {
      throw new Error('Data must be an array for insertMany');
    }

    const { data: result, error } = await this.supabase
      .from(table)
      .insert(data)
      .select(returning);

    if (error) throw this.formatError(error);
    return result;
  }

  async updateMany({ table, updates }) {
    const results = [];
    
    for (const { where, data } of updates) {
      const result = await this.update({ table, data, where });
      results.push(...result);
    }
    
    return results;
  }

  async deleteMany({ table, conditions }) {
    const results = [];
    
    for (const where of conditions) {
      const result = await this.delete({ table, where });
      results.push(...result);
    }
    
    return results;
  }

  // Raw SQL Operations
  async query({ sql, params = [] }) {
    // For SELECT queries
    const { data, error } = await this.supabase.rpc('exec_sql', {
      query: sql,
      params: params
    });

    if (error) {
      // If RPC doesn't exist, fall back to direct execution
      return this.executeDirect(sql, params);
    }
    
    return data;
  }

  async execute({ sql, params = [] }) {
    // For INSERT, UPDATE, DELETE, DDL
    return this.executeDirect(sql, params);
  }

  async executeDirect(sql, params = []) {
    // This is a simplified version - in production, you'd need a proper SQL execution endpoint
    // For now, we'll parse and execute common DDL commands
    
    const sqlLower = sql.toLowerCase().trim();
    
    if (sqlLower.startsWith('create table')) {
      return { success: true, message: 'Table creation requires using zephix_db_create_table' };
    } else if (sqlLower.startsWith('drop table')) {
      return { success: true, message: 'Table dropping requires using zephix_db_drop_table' };
    } else if (sqlLower.startsWith('alter table')) {
      return { success: true, message: 'Table alteration requires using specific column operations' };
    }
    
    // For other queries, we need a database function or edge function
    throw new Error('Direct SQL execution requires a Supabase edge function. Please create one or use the specific operation methods.');
  }

  // Schema Operations
  async createTable({ table, columns, primaryKey, ifNotExists = true }) {
    const columnDefs = columns.map(col => {
      if (typeof col === 'string') return col;
      return `${col.name} ${col.type}${col.constraints ? ' ' + col.constraints : ''}`;
    }).join(', ');

    const pkClause = primaryKey ? `, PRIMARY KEY (${primaryKey})` : '';
    const existsClause = ifNotExists ? 'IF NOT EXISTS' : '';
    
    const sql = `CREATE TABLE ${existsClause} ${table} (${columnDefs}${pkClause})`;
    
    // Note: This requires a database function to execute DDL
    return { 
      success: false, 
      message: 'Direct DDL execution requires a Supabase database function. Please create one.',
      sql: sql 
    };
  }

  async dropTable({ table, cascade = false, ifExists = true }) {
    const cascadeClause = cascade ? 'CASCADE' : '';
    const existsClause = ifExists ? 'IF EXISTS' : '';
    
    const sql = `DROP TABLE ${existsClause} ${table} ${cascadeClause}`;
    
    return { 
      success: false, 
      message: 'Direct DDL execution requires a Supabase database function.',
      sql: sql 
    };
  }

  async addColumn({ table, column, type, constraints }) {
    const sql = `ALTER TABLE ${table} ADD COLUMN ${column} ${type}${constraints ? ' ' + constraints : ''}`;
    
    return { 
      success: false, 
      message: 'Direct DDL execution requires a Supabase database function.',
      sql: sql 
    };
  }

  async dropColumn({ table, column, cascade = false }) {
    const cascadeClause = cascade ? 'CASCADE' : '';
    const sql = `ALTER TABLE ${table} DROP COLUMN ${column} ${cascadeClause}`;
    
    return { 
      success: false, 
      message: 'Direct DDL execution requires a Supabase database function.',
      sql: sql 
    };
  }

  async renameColumn({ table, oldName, newName }) {
    const sql = `ALTER TABLE ${table} RENAME COLUMN ${oldName} TO ${newName}`;
    
    return { 
      success: false, 
      message: 'Direct DDL execution requires a Supabase database function.',
      sql: sql 
    };
  }

  async createIndex({ name, table, columns, unique = false, method = 'btree' }) {
    const uniqueClause = unique ? 'UNIQUE' : '';
    const indexName = name || `idx_${table}_${columns.join('_')}`;
    const columnList = Array.isArray(columns) ? columns.join(', ') : columns;
    
    const sql = `CREATE ${uniqueClause} INDEX ${indexName} ON ${table} USING ${method} (${columnList})`;
    
    return { 
      success: false, 
      message: 'Direct DDL execution requires a Supabase database function.',
      sql: sql 
    };
  }

  async createView({ name, query, replace = false }) {
    const replaceClause = replace ? 'OR REPLACE' : '';
    const sql = `CREATE ${replaceClause} VIEW ${name} AS ${query}`;
    
    return { 
      success: false, 
      message: 'Direct DDL execution requires a Supabase database function.',
      sql: sql 
    };
  }

  // Utility Operations
  async listTables({ schema = 'public', includeViews = false }) {
    const { data, error } = await this.supabase
      .from('information_schema.tables')
      .select('table_name, table_type')
      .eq('table_schema', schema)
      .in('table_type', includeViews ? ['BASE TABLE', 'VIEW'] : ['BASE TABLE'])
      .order('table_name');

    if (error) throw this.formatError(error);
    return data;
  }

  async describeTable({ table }) {
    const { data, error } = await this.supabase
      .from('information_schema.columns')
      .select('*')
      .eq('table_name', table)
      .order('ordinal_position');

    if (error) throw this.formatError(error);
    
    return data.map(col => ({
      name: col.column_name,
      type: col.data_type,
      nullable: col.is_nullable === 'YES',
      default: col.column_default,
      maxLength: col.character_maximum_length,
      position: col.ordinal_position
    }));
  }

  async count({ table, where = {} }) {
    let query = this.supabase.from(table).select('*', { count: 'exact', head: true });

    // Apply filters
    for (const [key, value] of Object.entries(where)) {
      query = query.eq(key, value);
    }

    const { count, error } = await query;

    if (error) throw this.formatError(error);
    return { count };
  }

  async backupTable({ table, format = 'json' }) {
    const { data, error } = await this.supabase
      .from(table)
      .select('*')
      .limit(this.maxRows);

    if (error) throw this.formatError(error);

    if (format === 'csv') {
      return this.convertToCSV(data);
    }

    return {
      table,
      timestamp: new Date().toISOString(),
      rowCount: data.length,
      data
    };
  }

  // Helper Methods
  applyOperator(query, key, { op, value }) {
    const operators = {
      eq: 'eq',
      neq: 'neq',
      gt: 'gt',
      gte: 'gte',
      lt: 'lt',
      lte: 'lte',
      like: 'like',
      ilike: 'ilike',
      in: 'in',
      contains: 'contains',
      containedBy: 'containedBy'
    };

    if (!operators[op]) {
      throw new Error(`Unknown operator: ${op}`);
    }

    return query[operators[op]](key, value);
  }

  formatError(error) {
    return new Error(`Supabase Error: ${error.message || error}`);
  }

  convertToCSV(data) {
    if (!data || data.length === 0) return '';
    
    const headers = Object.keys(data[0]);
    const csv = [
      headers.join(','),
      ...data.map(row => 
        headers.map(header => 
          JSON.stringify(row[header] ?? '')
        ).join(',')
      )
    ].join('\n');

    return csv;
  }
}