import fs from 'fs-extra';
import path from 'path';

export class ConversationHandler {
  constructor({ conversationsPath, logger }) {
    this.conversationsPath = conversationsPath;
    this.logger = logger;
    this.conversations = new Map();
  }

  async initialize() {
    await fs.ensureDir(this.conversationsPath);
    await this.loadConversations();
    this.logger.info('✅ Conversation handler initialized');
  }

  async loadConversations() {
    try {
      const files = await fs.readdir(this.conversationsPath);
      const jsonFiles = files.filter(f => f.endsWith('.json'));
      
      for (const file of jsonFiles) {
        const filePath = path.join(this.conversationsPath, file);
        const conversation = await fs.readJson(filePath);
        this.conversations.set(conversation.id, conversation);
      }
      
      this.logger.info(`💬 Loaded ${this.conversations.size} conversations`);
    } catch (error) {
      this.logger.warn('Failed to load conversations:', error.message);
    }
  }

  async handleTool(toolName, args) {
    switch (toolName) {
      case 'rapidlyx_conversation_save':
        return await this.saveConversation(args);
        
      case 'rapidlyx_conversation_search':
        return await this.searchConversations(args);
        
      default:
        throw new Error(`Unknown conversation tool: ${toolName}`);
    }
  }

  async saveConversation({ messages, title, tags = [], metadata = {} }) {
    try {
      const id = this.generateConversationId();
      const conversation = {
        id,
        title: title || this.generateTitle(messages),
        messages,
        tags,
        metadata,
        createdAt: new Date().toISOString(),
        messageCount: messages.length
      };
      
      // Save to file
      const filePath = path.join(this.conversationsPath, `${id}.json`);
      await fs.writeJson(filePath, conversation, { spaces: 2 });
      
      // Store in memory
      this.conversations.set(id, conversation);
      
      this.logger.info(`💬 Saved conversation: ${id}`);
      
      return {
        success: true,
        id,
        message: 'Conversation saved successfully'
      };
    } catch (error) {
      this.logger.error('Save conversation error:', error);
      throw error;
    }
  }

  async searchConversations({ query, dateRange, tags, limit = 10 }) {
    try {
      const results = [];
      const searchTerm = query.toLowerCase();
      
      for (const [id, conversation] of this.conversations) {
        // Date range filter
        if (dateRange) {
          const createdAt = new Date(conversation.createdAt);
          if (dateRange.start && createdAt < new Date(dateRange.start)) continue;
          if (dateRange.end && createdAt > new Date(dateRange.end)) continue;
        }
        
        // Tag filter
        if (tags && tags.length > 0) {
          const hasMatchingTag = tags.some(tag => conversation.tags.includes(tag));
          if (!hasMatchingTag) continue;
        }
        
        // Text search
        const titleMatch = conversation.title.toLowerCase().includes(searchTerm);
        const messageMatch = conversation.messages.some(msg => 
          msg.content?.toLowerCase().includes(searchTerm)
        );
        
        if (titleMatch || messageMatch) {
          results.push({
            id,
            title: conversation.title,
            createdAt: conversation.createdAt,
            messageCount: conversation.messageCount,
            tags: conversation.tags,
            relevance: this.calculateConversationRelevance(conversation, searchTerm)
          });
        }
        
        if (results.length >= limit) break;
      }
      
      results.sort((a, b) => b.relevance - a.relevance);
      
      return {
        success: true,
        results: results.slice(0, limit),
        total: results.length,
        query
      };
    } catch (error) {
      this.logger.error('Search conversations error:', error);
      throw error;
    }
  }

  calculateConversationRelevance(conversation, searchTerm) {
    let score = 0;
    
    // Title match is worth more
    if (conversation.title.toLowerCase().includes(searchTerm)) {
      score += 10;
    }
    
    // Count message matches
    const messageMatches = conversation.messages.filter(msg => 
      msg.content?.toLowerCase().includes(searchTerm)
    ).length;
    score += messageMatches * 2;
    
    // Recent conversations get a boost
    const age = Date.now() - new Date(conversation.createdAt).getTime();
    const daysSinceCreated = age / (1000 * 60 * 60 * 24);
    score += Math.max(0, 10 - daysSinceCreated * 0.5);
    
    return score;
  }

  generateConversationId() {
    return `conv_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  generateTitle(messages) {
    if (!messages || messages.length === 0) return 'Untitled Conversation';
    
    const firstUserMessage = messages.find(msg => msg.role === 'user');
    if (firstUserMessage && firstUserMessage.content) {
      // Take first 50 characters as title
      return firstUserMessage.content.substring(0, 50).trim() + '...';
    }
    
    return `Conversation ${new Date().toLocaleDateString()}`;
  }

  async addConversation(conversationData) {
    return await this.saveConversation(conversationData);
  }

  async getResource() {
    return {
      type: 'conversations',
      total: this.conversations.size,
      recent: [...this.conversations.values()]
        .sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt))
        .slice(0, 5)
        .map(c => ({
          id: c.id,
          title: c.title,
          createdAt: c.createdAt,
          messageCount: c.messageCount
        }))
    };
  }
}