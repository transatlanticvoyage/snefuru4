export class AuditLogger {
  constructor(supabaseHandler) {
    this.supabase = supabaseHandler;
    this.tableName = process.env.ZEPHIX_AUDIT_TABLE || 'zephix_audit_log';
    this.enabled = process.env.ZEPHIX_AUDIT_ENABLED === 'true';
  }

  async log({
    operation,
    table_name,
    record_id,
    params,
    changes,
    error,
    duration_ms,
    row_count,
    success = true,
    result_preview
  }) {
    if (!this.enabled) return;

    try {
      const auditEntry = {
        operation,
        table_name: table_name || this.extractTableName(operation, params),
        record_id: record_id || this.extractRecordId(params),
        user_id: 'zephix-mcp',
        timestamp: new Date().toISOString(),
        query: this.extractQuery(operation, params),
        params: params ? JSON.stringify(params) : null,
        changes: changes ? JSON.stringify(changes) : null,
        error: error ? JSON.stringify({ message: error }) : null,
        duration_ms,
        row_count: row_count || this.extractRowCount(result_preview)
      };

      // Use the insert method to avoid circular dependency
      await this.supabase.insert({
        table: this.tableName,
        data: auditEntry,
        returning: 'id'
      });
      
    } catch (auditError) {
      // Don't throw errors from audit logging
      console.error('Audit logging failed:', auditError);
    }
  }

  extractTableName(operation, params) {
    if (params && params.table) return params.table;
    
    // Try to extract from operation name
    const match = operation.match(/zephix_db_(\w+)/);
    if (match && params && typeof params === 'object') {
      const firstParam = Object.keys(params)[0];
      if (firstParam === 'table') return params[firstParam];
    }
    
    return null;
  }

  extractRecordId(params) {
    if (!params) return null;
    
    // Common patterns for record IDs
    if (params.where && params.where.id) return params.where.id;
    if (params.data && params.data.id) return params.data.id;
    if (params.id) return params.id;
    
    return null;
  }

  extractQuery(operation, params) {
    if (params && params.sql) return params.sql;
    
    // Build a pseudo-query for CRUD operations
    const opMap = {
      zephix_db_select: 'SELECT',
      zephix_db_insert: 'INSERT',
      zephix_db_update: 'UPDATE',
      zephix_db_delete: 'DELETE'
    };
    
    const op = opMap[operation];
    if (op && params && params.table) {
      return `${op} ${params.table}`;
    }
    
    return operation;
  }

  extractRowCount(result_preview) {
    if (!result_preview) return null;
    
    if (result_preview.count !== undefined) return result_preview.count;
    if (Array.isArray(result_preview)) return result_preview.length;
    if (result_preview.data && Array.isArray(result_preview.data)) {
      return result_preview.data.length;
    }
    
    return null;
  }

  async createAuditTable() {
    // This method can be called to create the audit table if it doesn't exist
    const sql = `
      CREATE TABLE IF NOT EXISTS ${this.tableName} (
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

      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_timestamp 
        ON ${this.tableName}(timestamp DESC);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_table 
        ON ${this.tableName}(table_name);
      CREATE INDEX IF NOT EXISTS idx_${this.tableName}_operation 
        ON ${this.tableName}(operation);
    `;

    return {
      success: false,
      message: 'Please run this SQL in your Supabase dashboard to create the audit table',
      sql: sql
    };
  }
}