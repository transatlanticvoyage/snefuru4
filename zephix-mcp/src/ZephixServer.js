import { SupabaseCRUD } from './handlers/SupabaseCRUD.js';
import { AuditLogger } from './utils/AuditLogger.js';
import { ErrorHandler } from './utils/ErrorHandler.js';
import { TOOLS_REGISTRY } from './config/tools.js';

export class ZephixServer {
  constructor(mcpServer) {
    this.mcpServer = mcpServer;
    this.supabaseHandler = null;
    this.auditLogger = null;
    this.errorHandler = new ErrorHandler();
  }

  async initialize() {
    try {
      // Initialize Supabase handler
      this.supabaseHandler = new SupabaseCRUD({
        url: process.env.SUPABASE_URL,
        serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      });

      // Initialize audit logger
      this.auditLogger = new AuditLogger(this.supabaseHandler);
      
      // Register all tools with MCP server
      this.registerTools();
      
      // Set up request handlers
      this.setupHandlers();
      
      console.error('Zephix Server initialized successfully');
    } catch (error) {
      console.error('Failed to initialize Zephix Server:', error);
      throw error;
    }
  }

  registerTools() {
    // Register each tool from the registry
    for (const [toolName, toolConfig] of Object.entries(TOOLS_REGISTRY)) {
      this.mcpServer.setRequestHandler(
        `tools/list`,
        async () => ({
          tools: Object.entries(TOOLS_REGISTRY).map(([name, config]) => ({
            name,
            description: config.description,
            inputSchema: config.inputSchema,
          })),
        })
      );
    }
  }

  setupHandlers() {
    // Handle tool calls
    this.mcpServer.setRequestHandler('tools/call', async (request) => {
      const { name, arguments: args } = request.params;
      
      try {
        // Log the operation start
        const startTime = Date.now();
        
        // Check if tool exists
        if (!TOOLS_REGISTRY[name]) {
          throw new Error(`Unknown tool: ${name}`);
        }

        // Execute the appropriate handler method
        const result = await this.executeToolMethod(name, args);
        
        // Log successful operation
        if (process.env.ZEPHIX_AUDIT_ENABLED === 'true') {
          await this.auditLogger.log({
            operation: name,
            params: args,
            duration_ms: Date.now() - startTime,
            success: true,
            result_preview: this.getResultPreview(result),
          });
        }

        return {
          content: [
            {
              type: 'text',
              text: JSON.stringify(result, null, 2),
            },
          ],
        };
      } catch (error) {
        // Log failed operation
        if (process.env.ZEPHIX_AUDIT_ENABLED === 'true') {
          await this.auditLogger.log({
            operation: name,
            params: args,
            error: error.message,
            success: false,
          });
        }

        // Handle error gracefully
        return this.errorHandler.handle(error, name, args);
      }
    });
  }

  async executeToolMethod(toolName, args) {
    // Map tool names to handler methods
    const methodMap = {
      // Basic CRUD
      'zephix_db_select': () => this.supabaseHandler.select(args),
      'zephix_db_insert': () => this.supabaseHandler.insert(args),
      'zephix_db_update': () => this.supabaseHandler.update(args),
      'zephix_db_delete': () => this.supabaseHandler.delete(args),
      'zephix_db_upsert': () => this.supabaseHandler.upsert(args),
      
      // Batch operations
      'zephix_db_insert_many': () => this.supabaseHandler.insertMany(args),
      'zephix_db_update_many': () => this.supabaseHandler.updateMany(args),
      'zephix_db_delete_many': () => this.supabaseHandler.deleteMany(args),
      
      // Raw SQL
      'zephix_db_query': () => this.supabaseHandler.query(args),
      'zephix_db_execute': () => this.supabaseHandler.execute(args),
      
      // Schema operations
      'zephix_db_create_table': () => this.supabaseHandler.createTable(args),
      'zephix_db_drop_table': () => this.supabaseHandler.dropTable(args),
      'zephix_db_add_column': () => this.supabaseHandler.addColumn(args),
      'zephix_db_drop_column': () => this.supabaseHandler.dropColumn(args),
      'zephix_db_rename_column': () => this.supabaseHandler.renameColumn(args),
      'zephix_db_create_index': () => this.supabaseHandler.createIndex(args),
      'zephix_db_create_view': () => this.supabaseHandler.createView(args),
      
      // Utilities
      'zephix_db_list_tables': () => this.supabaseHandler.listTables(args),
      'zephix_db_describe_table': () => this.supabaseHandler.describeTable(args),
      'zephix_db_count': () => this.supabaseHandler.count(args),
      'zephix_db_backup_table': () => this.supabaseHandler.backupTable(args),
    };

    const method = methodMap[toolName];
    if (!method) {
      throw new Error(`Tool ${toolName} not implemented`);
    }

    return await method();
  }

  getResultPreview(result) {
    // Create a preview of the result for audit logging
    if (Array.isArray(result)) {
      return { count: result.length, sample: result.slice(0, 3) };
    }
    if (typeof result === 'object' && result !== null) {
      return { ...result };
    }
    return result;
  }
}