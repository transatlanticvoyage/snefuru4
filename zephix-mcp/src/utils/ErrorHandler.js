export class ErrorHandler {
  handle(error, operation, params) {
    const errorInfo = this.parseError(error);
    
    // Log error to console for debugging
    console.error(`Zephix Error in ${operation}:`, error);
    
    // Return structured error response
    return {
      content: [
        {
          type: 'text',
          text: JSON.stringify({
            success: false,
            error: {
              code: errorInfo.code,
              message: errorInfo.message,
              hint: errorInfo.hint,
              details: errorInfo.details,
              operation: operation,
              params: this.sanitizeParams(params)
            }
          }, null, 2)
        }
      ]
    };
  }

  parseError(error) {
    // Handle Supabase errors
    if (error.code && error.message) {
      return {
        code: error.code,
        message: error.message,
        hint: error.hint || this.getHintForError(error.code),
        details: error.details || null
      };
    }

    // Handle PostgreSQL errors
    if (error.message && error.message.includes('PGRST')) {
      const pgError = this.parsePgRestError(error.message);
      return {
        code: pgError.code,
        message: pgError.message,
        hint: this.getHintForError(pgError.code),
        details: null
      };
    }

    // Generic error
    return {
      code: 'UNKNOWN_ERROR',
      message: error.message || 'An unexpected error occurred',
      hint: 'Check the operation parameters and try again',
      details: error.stack || null
    };
  }

  parsePgRestError(message) {
    // Common PostgREST error patterns
    const patterns = {
      'PGRST116': 'Column not found',
      'PGRST202': 'Table not found',
      'PGRST301': 'JWT expired',
      'PGRST204': 'Relationship not found',
      '23505': 'Unique constraint violation',
      '23503': 'Foreign key violation',
      '23502': 'Not null violation',
      '42P01': 'Table does not exist',
      '42703': 'Column does not exist'
    };

    for (const [code, description] of Object.entries(patterns)) {
      if (message.includes(code)) {
        return { code, message: description };
      }
    }

    return { code: 'PGRST_ERROR', message: message };
  }

  getHintForError(code) {
    const hints = {
      'PGRST116': 'Check column names in your query. Use zephix_db_describe_table to see available columns.',
      'PGRST202': 'Check table name. Use zephix_db_list_tables to see available tables.',
      'PGRST301': 'Authentication token expired. Please reconfigure Zephix.',
      '23505': 'A record with this unique value already exists. Use zephix_db_upsert for insert-or-update.',
      '23503': 'Referenced record does not exist. Check foreign key relationships.',
      '23502': 'Required field is missing. Check table constraints with zephix_db_describe_table.',
      '42P01': 'Table not found. Use zephix_db_list_tables to see available tables.',
      '42703': 'Column not found. Use zephix_db_describe_table to see available columns.'
    };

    return hints[code] || 'Check the error message and verify your parameters.';
  }

  sanitizeParams(params) {
    if (!params) return null;
    
    // Remove sensitive data from params for error reporting
    const sanitized = { ...params };
    
    // List of potentially sensitive keys
    const sensitiveKeys = ['password', 'token', 'secret', 'key', 'auth'];
    
    for (const key of Object.keys(sanitized)) {
      if (sensitiveKeys.some(sensitive => key.toLowerCase().includes(sensitive))) {
        sanitized[key] = '[REDACTED]';
      }
    }
    
    return sanitized;
  }
}