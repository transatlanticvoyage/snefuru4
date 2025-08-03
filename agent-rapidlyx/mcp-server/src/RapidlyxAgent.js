import { DatabaseHandler } from './handlers/DatabaseHandler.js';
import { KnowledgeHandler } from './handlers/KnowledgeHandler.js';
import { WorkflowHandler } from './handlers/WorkflowHandler.js';
import { ConversationHandler } from './handlers/ConversationHandler.js';
import { FileSystemHandler } from './handlers/FileSystemHandler.js';
import { RAPIDLYX_TOOLS } from './config/tools.js';
import { ListToolsRequestSchema, CallToolRequestSchema, ListResourcesRequestSchema, ReadResourceRequestSchema } from '@modelcontextprotocol/sdk/types.js';

export class RapidlyxAgent {
  constructor(mcpServer, logger) {
    this.mcpServer = mcpServer;
    this.logger = logger;
    this.handlers = new Map();
    this.isInitialized = false;
  }

  async initialize() {
    try {
      this.logger.info('🔧 Initializing Rapidlyx Agent...');

      // Initialize handlers
      await this.initializeHandlers();
      
      // Register MCP tools
      await this.registerTools();
      
      // Register MCP resources
      await this.registerResources();
      
      // Setup event listeners
      this.setupEventListeners();

      this.isInitialized = true;
      this.logger.info('✅ Rapidlyx Agent initialized successfully');
      
    } catch (error) {
      this.logger.error('❌ Failed to initialize Rapidlyx Agent:', error);
      throw error;
    }
  }

  async initializeHandlers() {
    // Database operations handler
    this.handlers.set('database', new DatabaseHandler({
      url: process.env.SUPABASE_URL,
      serviceKey: process.env.SUPABASE_SERVICE_ROLE_KEY,
      logger: this.logger
    }));

    // Knowledge base handler
    this.handlers.set('knowledge', new KnowledgeHandler({
      vectorDbPath: './knowledge/vectors',
      docsPath: './knowledge/docs',
      logger: this.logger
    }));

    // Workflow automation handler
    this.handlers.set('workflow', new WorkflowHandler({
      workflowsPath: './workflows',
      logger: this.logger
    }));

    // Conversation memory handler
    this.handlers.set('conversation', new ConversationHandler({
      conversationsPath: './knowledge/conversations',
      logger: this.logger
    }));

    // File system operations handler
    this.handlers.set('filesystem', new FileSystemHandler({
      rootPath: process.cwd(),
      logger: this.logger
    }));

    // Initialize all handlers
    for (const [name, handler] of this.handlers) {
      try {
        await handler.initialize();
        this.logger.info(`✅ ${name} handler initialized`);
      } catch (error) {
        this.logger.error(`❌ Failed to initialize ${name} handler:`, error);
        throw error;
      }
    }
  }

  async registerTools() {
    // Register tools list handler
    this.mcpServer.setRequestHandler(ListToolsRequestSchema, async () => {
      return {
        tools: Object.entries(RAPIDLYX_TOOLS).map(([name, config]) => ({
          name,
          description: config.description,
          inputSchema: config.inputSchema
        }))
      };
    });

    // Register tools call handler
    this.mcpServer.setRequestHandler(CallToolRequestSchema, async (request) => {
      const toolName = request.params.name;
      const args = request.params.arguments || {};
      return await this.handleToolCall(toolName, args);
    });

    this.logger.info(`📋 Registered ${Object.keys(RAPIDLYX_TOOLS).length} tools`);
  }

  async registerResources() {
    // Register resources list handler
    this.mcpServer.setRequestHandler(ListResourcesRequestSchema, async () => {
      return {
        resources: [
          {
            uri: 'rapidlyx://knowledge',
            name: 'Knowledge Base',
            description: 'Access to Rapidlyx knowledge base'
          },
          {
            uri: 'rapidlyx://conversations',
            name: 'Conversation History',
            description: 'Access to conversation memory'
          },
          {
            uri: 'rapidlyx://workflows',
            name: 'Workflows',
            description: 'Access to automation workflows'
          }
        ]
      };
    });

    // Register resource read handler
    this.mcpServer.setRequestHandler(ReadResourceRequestSchema, async (request) => {
      return await this.handleResourceRead(request.params.uri);
    });
  }

  setupEventListeners() {
    // Listen for conversation updates
    process.on('rapidlyx:conversation', (data) => {
      this.handlers.get('conversation').addConversation(data);
    });

    // Listen for knowledge updates
    process.on('rapidlyx:knowledge', (data) => {
      this.handlers.get('knowledge').addKnowledge(data);
    });
  }

  async handleToolCall(toolName, args) {
    try {
      this.logger.info(`🔧 Tool call: ${toolName}`, args);

      // Route tool calls to appropriate handlers
      const handler = this.getHandlerForTool(toolName);
      if (!handler) {
        throw new Error(`No handler found for tool: ${toolName}`);
      }

      const result = await handler.handleTool(toolName, args);
      
      this.logger.info(`✅ Tool call completed: ${toolName}`);
      return {
        content: [
          {
            type: 'text',
            text: JSON.stringify(result, null, 2)
          }
        ]
      };

    } catch (error) {
      this.logger.error(`❌ Tool call failed: ${toolName}`, error);
      return {
        content: [
          {
            type: 'text',
            text: `Error: ${error.message}`
          }
        ],
        isError: true
      };
    }
  }

  async handleResourceRead(uri) {
    try {
      const [, resourceType] = uri.split('://');
      const handler = this.handlers.get(resourceType);
      
      if (!handler) {
        throw new Error(`No handler found for resource: ${resourceType}`);
      }

      const content = await handler.getResource();
      
      return {
        contents: [
          {
            uri,
            mimeType: 'application/json',
            text: JSON.stringify(content, null, 2)
          }
        ]
      };

    } catch (error) {
      this.logger.error(`❌ Resource read failed: ${uri}`, error);
      throw error;
    }
  }

  getHandlerForTool(toolName) {
    // Route tools to appropriate handlers based on naming convention
    if (toolName.startsWith('rapidlyx_db_')) {
      return this.handlers.get('database');
    } else if (toolName.startsWith('rapidlyx_knowledge_')) {
      return this.handlers.get('knowledge');
    } else if (toolName.startsWith('rapidlyx_workflow_')) {
      return this.handlers.get('workflow');
    } else if (toolName.startsWith('rapidlyx_conversation_')) {
      return this.handlers.get('conversation');
    } else if (toolName.startsWith('rapidlyx_fs_')) {
      return this.handlers.get('filesystem');
    }
    
    return null;
  }

  // Public API methods for the agent
  async addConversation(conversationData) {
    return await this.handlers.get('conversation').addConversation(conversationData);
  }

  async addKnowledge(knowledgeData) {
    return await this.handlers.get('knowledge').addKnowledge(knowledgeData);
  }

  async executeWorkflow(workflowName, params) {
    return await this.handlers.get('workflow').execute(workflowName, params);
  }

  async queryKnowledge(query) {
    return await this.handlers.get('knowledge').query(query);
  }
}