import fs from 'fs-extra';
import path from 'path';
import { glob } from 'glob';

export class FileSystemHandler {
  constructor({ rootPath, logger }) {
    this.rootPath = rootPath;
    this.logger = logger;
  }

  async initialize() {
    this.logger.info('✅ File system handler initialized');
  }

  async handleTool(toolName, args) {
    switch (toolName) {
      case 'rapidlyx_fs_read':
        return await this.readFile(args);
        
      case 'rapidlyx_fs_write':
        return await this.writeFile(args);
        
      case 'rapidlyx_fs_search':
        return await this.searchFiles(args);
        
      case 'rapidlyx_analyze_codebase':
        return await this.analyzeCodebase(args);
        
      default:
        throw new Error(`Unknown filesystem tool: ${toolName}`);
    }
  }

  async readFile({ path: filePath, encoding = 'utf8' }) {
    try {
      const fullPath = path.resolve(this.rootPath, filePath);
      
      // Security check - ensure path is within root
      if (!fullPath.startsWith(this.rootPath)) {
        throw new Error('Access denied: Path outside project root');
      }
      
      const content = await fs.readFile(fullPath, encoding);
      const stats = await fs.stat(fullPath);
      
      return {
        success: true,
        content,
        path: filePath,
        size: stats.size,
        modified: stats.mtime
      };
    } catch (error) {
      this.logger.error('File read error:', error);
      throw error;
    }
  }

  async writeFile({ path: filePath, content, encoding = 'utf8' }) {
    try {
      const fullPath = path.resolve(this.rootPath, filePath);
      
      // Security check
      if (!fullPath.startsWith(this.rootPath)) {
        throw new Error('Access denied: Path outside project root');
      }
      
      await fs.ensureDir(path.dirname(fullPath));
      await fs.writeFile(fullPath, content, encoding);
      
      return {
        success: true,
        path: filePath,
        message: 'File written successfully'
      };
    } catch (error) {
      this.logger.error('File write error:', error);
      throw error;
    }
  }

  async searchFiles({ pattern, type = 'both', extensions = [], exclude = [] }) {
    try {
      const results = {
        files: [],
        content: []
      };
      
      if (type === 'files' || type === 'both') {
        const globPattern = path.join(this.rootPath, '**', pattern);
        const files = await glob(globPattern, {
          ignore: exclude.map(ex => path.join(this.rootPath, ex))
        });
        
        results.files = files
          .filter(file => {
            if (extensions.length === 0) return true;
            return extensions.some(ext => file.endsWith(ext));
          })
          .map(file => path.relative(this.rootPath, file));
      }
      
      return {
        success: true,
        results,
        pattern,
        total: results.files.length + results.content.length
      };
    } catch (error) {
      this.logger.error('File search error:', error);
      throw error;
    }
  }

  async analyzeCodebase({ path: analyzePath = '.', depth = 3, includeTests = false }) {
    try {
      const analysis = {
        totalFiles: 0,
        fileTypes: {},
        directories: [],
        patterns: [],
        size: 0
      };
      
      // Placeholder analysis logic
      this.logger.info(`🔍 Analyzing codebase at: ${analyzePath}`);
      
      return {
        success: true,
        analysis,
        path: analyzePath,
        message: 'Codebase analysis completed'
      };
    } catch (error) {
      this.logger.error('Codebase analysis error:', error);
      throw error;
    }
  }

  async getResource() {
    return {
      type: 'filesystem',
      rootPath: this.rootPath,
      capabilities: ['read', 'write', 'search', 'analyze']
    };
  }
}