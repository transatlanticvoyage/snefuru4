import { createClient } from '@supabase/supabase-js';

export class DatabaseHandler {
  constructor({ url, serviceKey, logger }) {
    this.supabaseUrl = url;
    this.serviceKey = serviceKey;
    this.logger = logger;
    this.supabase = null;
  }

  async initialize() {
    if (!this.supabaseUrl || !this.serviceKey) {
      throw new Error('Supabase URL and service key are required');
    }

    this.supabase = createClient(this.supabaseUrl, this.serviceKey, {
      auth: {
        autoRefreshToken: false,
        persistSession: false
      }
    });

    this.logger.info('✅ Database handler connected to Supabase');
  }

  async handleTool(toolName, args) {
    switch (toolName) {
      case 'rapidlyx_db_query':
        return await this.executeQuery(args.query, args.params);
      
      case 'rapidlyx_db_select':
        return await this.selectData(args);
        
      case 'rapidlyx_db_insert':
        return await this.insertData(args.table, args.data);
        
      case 'rapidlyx_db_update':
        return await this.updateData(args.table, args.data, args.where);
        
      default:
        throw new Error(`Unknown database tool: ${toolName}`);
    }
  }

  async executeQuery(query, params = []) {
    try {
      // For now, implement basic query execution
      // This would be expanded with proper query execution logic
      this.logger.info(`Executing query: ${query}`);
      
      return {
        success: true,
        message: 'Query executed (placeholder)',
        query,
        params
      };
    } catch (error) {
      this.logger.error('Database query error:', error);
      throw error;
    }
  }

  async selectData({ table, columns = '*', where = {}, limit, orderBy }) {
    try {
      let query = this.supabase.from(table).select(columns);
      
      // Apply filters
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      if (limit) query = query.limit(limit);
      if (orderBy) query = query.order(orderBy);
      
      const { data, error } = await query;
      
      if (error) throw error;
      
      return {
        success: true,
        data,
        count: data?.length || 0
      };
    } catch (error) {
      this.logger.error('Database select error:', error);
      throw error;
    }
  }

  async insertData(table, data) {
    try {
      const { data: result, error } = await this.supabase
        .from(table)
        .insert(data)
        .select();
      
      if (error) throw error;
      
      return {
        success: true,
        data: result,
        message: `Inserted ${result?.length || 0} rows`
      };
    } catch (error) {
      this.logger.error('Database insert error:', error);
      throw error;
    }
  }

  async updateData(table, data, where) {
    try {
      let query = this.supabase.from(table).update(data);
      
      // Apply where conditions
      Object.entries(where).forEach(([key, value]) => {
        query = query.eq(key, value);
      });
      
      const { data: result, error } = await query.select();
      
      if (error) throw error;
      
      return {
        success: true,
        data: result,
        message: `Updated ${result?.length || 0} rows`
      };
    } catch (error) {
      this.logger.error('Database update error:', error);
      throw error;
    }
  }

  async getResource() {
    return {
      type: 'database',
      status: 'connected',
      url: this.supabaseUrl,
      tools: ['query', 'select', 'insert', 'update']
    };
  }
}