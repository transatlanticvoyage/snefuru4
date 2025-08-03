import fs from 'fs-extra';
import path from 'path';

export class KnowledgeHandler {
  constructor({ vectorDbPath, docsPath, logger }) {
    this.vectorDbPath = vectorDbPath;
    this.docsPath = docsPath;
    this.logger = logger;
    this.knowledgeStore = new Map();
  }

  async initialize() {
    // Ensure directories exist
    await fs.ensureDir(this.vectorDbPath);
    await fs.ensureDir(this.docsPath);
    
    // Load existing knowledge
    await this.loadKnowledge();
    
    this.logger.info('✅ Knowledge handler initialized');
  }

  async loadKnowledge() {
    try {
      const knowledgeFile = path.join(this.docsPath, 'knowledge.json');
      if (await fs.pathExists(knowledgeFile)) {
        const data = await fs.readJson(knowledgeFile);
        Object.entries(data).forEach(([key, value]) => {
          this.knowledgeStore.set(key, value);
        });
        this.logger.info(`📚 Loaded ${this.knowledgeStore.size} knowledge entries`);
      }
    } catch (error) {
      this.logger.warn('Failed to load existing knowledge:', error.message);
    }
  }

  async saveKnowledge() {
    try {
      const knowledgeFile = path.join(this.docsPath, 'knowledge.json');
      const data = Object.fromEntries(this.knowledgeStore);
      await fs.writeJson(knowledgeFile, data, { spaces: 2 });
    } catch (error) {
      this.logger.error('Failed to save knowledge:', error);
    }
  }

  async handleTool(toolName, args) {
    switch (toolName) {
      case 'rapidlyx_knowledge_search':
        return await this.searchKnowledge(args);
        
      case 'rapidlyx_knowledge_add':
        return await this.addKnowledge(args);
        
      case 'rapidlyx_knowledge_update':
        return await this.updateKnowledge(args);
        
      default:
        throw new Error(`Unknown knowledge tool: ${toolName}`);
    }
  }

  async searchKnowledge({ query, type = 'all', limit = 10 }) {
    try {
      const results = [];
      const searchTerm = query.toLowerCase();
      
      for (const [id, entry] of this.knowledgeStore) {
        if (type !== 'all' && entry.type !== type) continue;
        
        const content = entry.content.toLowerCase();
        const title = entry.title?.toLowerCase() || '';
        const tags = entry.tags?.join(' ').toLowerCase() || '';
        
        if (content.includes(searchTerm) || title.includes(searchTerm) || tags.includes(searchTerm)) {
          results.push({
            id,
            score: this.calculateRelevanceScore(entry, searchTerm),
            ...entry
          });
        }
        
        if (results.length >= limit) break;
      }
      
      results.sort((a, b) => b.score - a.score);
      
      return {
        success: true,
        results: results.slice(0, limit),
        total: results.length,
        query
      };
    } catch (error) {
      this.logger.error('Knowledge search error:', error);
      throw error;
    }
  }

  async addKnowledge({ content, type, tags = [], metadata = {} }) {
    try {
      const id = this.generateId();
      const entry = {
        id,
        content,
        type,
        tags,
        metadata,
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
      };
      
      this.knowledgeStore.set(id, entry);
      await this.saveKnowledge();
      
      this.logger.info(`📝 Added knowledge entry: ${id}`);
      
      return {
        success: true,
        id,
        message: 'Knowledge added successfully'
      };
    } catch (error) {
      this.logger.error('Add knowledge error:', error);
      throw error;
    }
  }

  async updateKnowledge({ id, content, tags, metadata }) {
    try {
      const existing = this.knowledgeStore.get(id);
      if (!existing) {
        throw new Error(`Knowledge entry not found: ${id}`);
      }
      
      const updated = {
        ...existing,
        updatedAt: new Date().toISOString()
      };
      
      if (content !== undefined) updated.content = content;
      if (tags !== undefined) updated.tags = tags;
      if (metadata !== undefined) updated.metadata = { ...updated.metadata, ...metadata };
      
      this.knowledgeStore.set(id, updated);
      await this.saveKnowledge();
      
      this.logger.info(`📝 Updated knowledge entry: ${id}`);
      
      return {
        success: true,
        id,
        message: 'Knowledge updated successfully'
      };
    } catch (error) {
      this.logger.error('Update knowledge error:', error);
      throw error;
    }
  }

  calculateRelevanceScore(entry, searchTerm) {
    let score = 0;
    const content = entry.content.toLowerCase();
    const title = entry.title?.toLowerCase() || '';
    
    // Title matches are more important
    if (title.includes(searchTerm)) score += 10;
    
    // Count occurrences in content
    const matches = (content.match(new RegExp(searchTerm, 'g')) || []).length;
    score += matches;
    
    // Recent entries get a slight boost
    const age = Date.now() - new Date(entry.createdAt).getTime();
    const daysSinceCreated = age / (1000 * 60 * 60 * 24);
    score += Math.max(0, 5 - daysSinceCreated * 0.1);
    
    return score;
  }

  generateId() {
    return `knowledge_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
  }

  async getResource() {
    return {
      type: 'knowledge',
      entries: this.knowledgeStore.size,
      types: [...new Set([...this.knowledgeStore.values()].map(e => e.type))],
      lastUpdated: new Date().toISOString()
    };
  }
}