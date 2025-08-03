export const RAPIDLYX_TOOLS = {
  // Database Operations
  rapidlyx_db_query: {
    description: 'Execute SQL queries on the Snefuru database',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'SQL query to execute' },
        params: { type: 'array', description: 'Query parameters' }
      },
      required: ['query']
    }
  },

  rapidlyx_db_select: {
    description: 'Select data from a database table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        columns: { type: 'string', description: 'Columns to select (default: *)' },
        where: { type: 'object', description: 'Filter conditions' },
        limit: { type: 'number', description: 'Number of rows to return' },
        orderBy: { type: 'string', description: 'Order by clause' }
      },
      required: ['table']
    }
  },

  rapidlyx_db_insert: {
    description: 'Insert data into a database table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'object', description: 'Data to insert' }
      },
      required: ['table', 'data']
    }
  },

  rapidlyx_db_update: {
    description: 'Update data in a database table',
    inputSchema: {
      type: 'object',
      properties: {
        table: { type: 'string', description: 'Table name' },
        data: { type: 'object', description: 'Data to update' },
        where: { type: 'object', description: 'Filter conditions' }
      },
      required: ['table', 'data', 'where']
    }
  },

  // Knowledge Base Operations
  rapidlyx_knowledge_search: {
    description: 'Search the Rapidlyx knowledge base',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        type: { type: 'string', enum: ['all', 'conversations', 'docs', 'patterns'], description: 'Type of knowledge to search' },
        limit: { type: 'number', description: 'Number of results to return' }
      },
      required: ['query']
    }
  },

  rapidlyx_knowledge_add: {
    description: 'Add new knowledge to the knowledge base',
    inputSchema: {
      type: 'object',
      properties: {
        content: { type: 'string', description: 'Knowledge content' },
        type: { type: 'string', enum: ['conversation', 'documentation', 'pattern', 'workflow'], description: 'Type of knowledge' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tags for categorization' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['content', 'type']
    }
  },

  rapidlyx_knowledge_update: {
    description: 'Update existing knowledge in the knowledge base',
    inputSchema: {
      type: 'object',
      properties: {
        id: { type: 'string', description: 'Knowledge entry ID' },
        content: { type: 'string', description: 'Updated content' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Updated tags' },
        metadata: { type: 'object', description: 'Updated metadata' }
      },
      required: ['id']
    }
  },

  // Conversation Management
  rapidlyx_conversation_save: {
    description: 'Save a conversation to memory',
    inputSchema: {
      type: 'object',
      properties: {
        messages: { type: 'array', description: 'Array of conversation messages' },
        title: { type: 'string', description: 'Conversation title' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Conversation tags' },
        metadata: { type: 'object', description: 'Additional metadata' }
      },
      required: ['messages']
    }
  },

  rapidlyx_conversation_search: {
    description: 'Search conversation history',
    inputSchema: {
      type: 'object',
      properties: {
        query: { type: 'string', description: 'Search query' },
        dateRange: { type: 'object', description: 'Date range filter' },
        tags: { type: 'array', items: { type: 'string' }, description: 'Tag filters' },
        limit: { type: 'number', description: 'Number of results to return' }
      },
      required: ['query']
    }
  },

  // Workflow Operations
  rapidlyx_workflow_execute: {
    description: 'Execute a predefined workflow',
    inputSchema: {
      type: 'object',
      properties: {
        workflow: { type: 'string', description: 'Workflow name' },
        params: { type: 'object', description: 'Workflow parameters' },
        dryRun: { type: 'boolean', description: 'Run in dry-run mode' }
      },
      required: ['workflow']
    }
  },

  rapidlyx_workflow_create: {
    description: 'Create a new workflow',
    inputSchema: {
      type: 'object',
      properties: {
        name: { type: 'string', description: 'Workflow name' },
        description: { type: 'string', description: 'Workflow description' },
        steps: { type: 'array', description: 'Workflow steps' },
        triggers: { type: 'array', description: 'Workflow triggers' }
      },
      required: ['name', 'steps']
    }
  },

  rapidlyx_workflow_list: {
    description: 'List all available workflows',
    inputSchema: {
      type: 'object',
      properties: {
        category: { type: 'string', description: 'Filter by category' },
        status: { type: 'string', enum: ['active', 'inactive', 'all'], description: 'Filter by status' }
      }
    }
  },

  // File System Operations
  rapidlyx_fs_read: {
    description: 'Read file contents from the Snefuru codebase',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        encoding: { type: 'string', description: 'File encoding (default: utf8)' }
      },
      required: ['path']
    }
  },

  rapidlyx_fs_write: {
    description: 'Write content to a file in the Snefuru codebase',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'File path relative to project root' },
        content: { type: 'string', description: 'Content to write' },
        encoding: { type: 'string', description: 'File encoding (default: utf8)' }
      },
      required: ['path', 'content']
    }
  },

  rapidlyx_fs_search: {
    description: 'Search for files and content in the Snefuru codebase',
    inputSchema: {
      type: 'object',
      properties: {
        pattern: { type: 'string', description: 'Search pattern or regex' },
        type: { type: 'string', enum: ['files', 'content', 'both'], description: 'Search type' },
        extensions: { type: 'array', items: { type: 'string' }, description: 'File extensions to include' },
        exclude: { type: 'array', items: { type: 'string' }, description: 'Paths to exclude' }
      },
      required: ['pattern']
    }
  },

  // Analysis and Learning
  rapidlyx_analyze_codebase: {
    description: 'Analyze the Snefuru codebase for patterns and insights',
    inputSchema: {
      type: 'object',
      properties: {
        path: { type: 'string', description: 'Path to analyze (default: entire codebase)' },
        depth: { type: 'number', description: 'Analysis depth' },
        includeTests: { type: 'boolean', description: 'Include test files in analysis' }
      }
    }
  },

  rapidlyx_learn_patterns: {
    description: 'Learn coding patterns from recent changes',
    inputSchema: {
      type: 'object',
      properties: {
        since: { type: 'string', description: 'Learn from changes since this date' },
        author: { type: 'string', description: 'Learn from specific author' },
        fileTypes: { type: 'array', items: { type: 'string' }, description: 'File types to analyze' }
      }
    }
  },

  // Integration Operations
  rapidlyx_wordpress_analyze: {
    description: 'Analyze WordPress sites in the Snefuru system',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Specific site ID to analyze' },
        userId: { type: 'string', description: 'Analyze sites for specific user' },
        includePlugins: { type: 'boolean', description: 'Include plugin analysis' },
        includeThemes: { type: 'boolean', description: 'Include theme analysis' }
      }
    }
  },

  rapidlyx_wordpress_suggest: {
    description: 'Suggest WordPress optimizations and improvements',
    inputSchema: {
      type: 'object',
      properties: {
        siteId: { type: 'string', description: 'Site ID to analyze' },
        focusArea: { type: 'string', enum: ['performance', 'security', 'seo', 'all'], description: 'Focus area for suggestions' }
      },
      required: ['siteId']
    }
  }
};