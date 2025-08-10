// File system monitor for automatic Claude Code export processing

import * as fs from 'fs';
import * as path from 'path';
import { EventEmitter } from 'events';
import { ClaudeCodeParser } from './parsers/ClaudeCodeParser';
import { yoshidexDatabaseService } from './YoshidexDatabaseService';

export interface FileMonitorConfig {
  watchDirectory: string;
  filePatterns: string[];
  autoImport: boolean;
  defaultUserId?: string;
  processedDirectory?: string;
  errorDirectory?: string;
}

export interface FileProcessResult {
  filePath: string;
  success: boolean;
  sessionId?: string;
  error?: string;
  messageCount?: number;
}

export class FileMonitor extends EventEmitter {
  private config: FileMonitorConfig;
  private watcher: fs.FSWatcher | null = null;
  private isMonitoring = false;
  private processedFiles = new Set<string>();

  constructor(config: FileMonitorConfig) {
    super();
    this.config = {
      filePatterns: ['*.json', '*.md'],
      autoImport: true,
      processedDirectory: path.join(config.watchDirectory, 'processed'),
      errorDirectory: path.join(config.watchDirectory, 'errors'),
      ...config
    };
    
    this.setupDirectories();
  }

  private async setupDirectories(): Promise<void> {
    try {
      // Ensure watch directory exists
      if (!fs.existsSync(this.config.watchDirectory)) {
        fs.mkdirSync(this.config.watchDirectory, { recursive: true });
      }
      
      // Create processed and error directories
      if (this.config.processedDirectory && !fs.existsSync(this.config.processedDirectory)) {
        fs.mkdirSync(this.config.processedDirectory, { recursive: true });
      }
      
      if (this.config.errorDirectory && !fs.existsSync(this.config.errorDirectory)) {
        fs.mkdirSync(this.config.errorDirectory, { recursive: true });
      }
    } catch (error) {
      console.error('Failed to setup directories:', error);
    }
  }

  public startMonitoring(): void {
    if (this.isMonitoring) {
      console.log('File monitor is already running');
      return;
    }

    try {
      this.watcher = fs.watch(this.config.watchDirectory, { recursive: false }, (eventType, filename) => {
        if (eventType === 'rename' && filename) {
          this.handleFileEvent(filename);
        }
      });

      this.isMonitoring = true;
      console.log(`File monitor started watching: ${this.config.watchDirectory}`);
      this.emit('monitoring_started', { directory: this.config.watchDirectory });
      
      // Process any existing files
      this.processExistingFiles();
      
    } catch (error) {
      console.error('Failed to start file monitoring:', error);
      this.emit('error', error);
    }
  }

  public stopMonitoring(): void {
    if (!this.isMonitoring) {
      return;
    }

    if (this.watcher) {
      this.watcher.close();
      this.watcher = null;
    }

    this.isMonitoring = false;
    console.log('File monitor stopped');
    this.emit('monitoring_stopped');
  }

  private async processExistingFiles(): Promise<void> {
    try {
      const files = fs.readdirSync(this.config.watchDirectory);
      
      for (const filename of files) {
        if (this.shouldProcessFile(filename)) {
          await this.processFile(filename);
        }
      }
    } catch (error) {
      console.error('Failed to process existing files:', error);
    }
  }

  private async handleFileEvent(filename: string): Promise<void> {
    // Debounce file events
    setTimeout(async () => {
      if (this.shouldProcessFile(filename) && !this.processedFiles.has(filename)) {
        await this.processFile(filename);
      }
    }, 1000);
  }

  private shouldProcessFile(filename: string): boolean {
    const ext = path.extname(filename).toLowerCase();
    const supportedExtensions = ['.json', '.md'];
    
    // Check if file extension is supported
    if (!supportedExtensions.includes(ext)) {
      return false;
    }
    
    // Check if filename matches any patterns
    const matchesPattern = this.config.filePatterns.some(pattern => {
      // Simple glob pattern matching
      const regexPattern = pattern.replace(/\*/g, '.*');
      return new RegExp(regexPattern).test(filename);
    });
    
    return matchesPattern;
  }

  private async processFile(filename: string): Promise<void> {
    const filePath = path.join(this.config.watchDirectory, filename);
    
    // Check if file exists and is readable
    if (!fs.existsSync(filePath)) {
      console.log(`File no longer exists: ${filename}`);
      return;
    }
    
    // Mark as being processed
    this.processedFiles.add(filename);
    
    console.log(`Processing file: ${filename}`);
    this.emit('file_processing_started', { filename, filePath });
    
    try {
      // Wait a bit to ensure file write is complete
      await new Promise(resolve => setTimeout(resolve, 2000));
      
      // Parse the conversation file
      const session = await ClaudeCodeParser.parseConversationFile(filePath);
      
      if (!session) {
        throw new Error('Failed to parse conversation file');
      }
      
      // Set default user ID if provided and not already set
      if (this.config.defaultUserId && !session.user_id) {
        session.user_id = this.config.defaultUserId;
      }
      
      // Auto-import if enabled
      if (this.config.autoImport && session.user_id) {
        const savedSession = await yoshidexDatabaseService.createSession(session);
        
        if (!savedSession) {
          throw new Error('Failed to save session to database');
        }
        
        // Parse and save messages
        const fileContent = fs.readFileSync(filePath, 'utf-8');
        let conversation;
        
        const fileExt = path.extname(filePath).toLowerCase();
        if (fileExt === '.json') {
          conversation = JSON.parse(fileContent);
        } else {
          // Re-parse for message extraction
          conversation = await ClaudeCodeParser.parseConversationFile(filePath);
        }
        
        let messageCount = 0;
        if (conversation) {
          const messages = ClaudeCodeParser.convertMessagesToYoshidex(
            conversation, 
            savedSession.yoshidex_session_id
          );
          
          // Save messages
          for (const message of messages) {
            const savedMessage = await yoshidexDatabaseService.addMessage(message);
            if (savedMessage) {
              messageCount++;
            }
          }
          
          // Update session with actual message count
          await yoshidexDatabaseService.updateSession(savedSession.yoshidex_session_id, {
            total_messages: messageCount
          });
        }
        
        const result: FileProcessResult = {
          filePath,
          success: true,
          sessionId: savedSession.yoshidex_session_id,
          messageCount
        };
        
        console.log(`Successfully processed ${filename}: ${messageCount} messages`);
        this.emit('file_processed', result);
        
        // Move file to processed directory
        await this.moveFile(filePath, this.config.processedDirectory!, filename);
        
      } else {
        // File parsed but not auto-imported
        const result: FileProcessResult = {
          filePath,
          success: true,
          messageCount: session.total_messages
        };
        
        console.log(`File parsed but not imported: ${filename}`);
        this.emit('file_parsed', result);
      }
      
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error';
      
      const result: FileProcessResult = {
        filePath,
        success: false,
        error: errorMessage
      };
      
      console.error(`Failed to process ${filename}:`, error);
      this.emit('file_processing_failed', result);
      
      // Move file to error directory
      if (this.config.errorDirectory) {
        await this.moveFile(filePath, this.config.errorDirectory, filename);
      }
    } finally {
      // Remove from processing set
      this.processedFiles.delete(filename);
    }
  }

  private async moveFile(sourcePath: string, targetDirectory: string, filename: string): Promise<void> {
    try {
      const targetPath = path.join(targetDirectory, filename);
      
      // If target file exists, add timestamp
      let finalTargetPath = targetPath;
      if (fs.existsSync(targetPath)) {
        const timestamp = new Date().toISOString().replace(/[:.]/g, '-');
        const ext = path.extname(filename);
        const nameWithoutExt = path.basename(filename, ext);
        finalTargetPath = path.join(targetDirectory, `${nameWithoutExt}_${timestamp}${ext}`);
      }
      
      fs.renameSync(sourcePath, finalTargetPath);
      console.log(`Moved file: ${filename} -> ${path.basename(finalTargetPath)}`);
      
    } catch (error) {
      console.error(`Failed to move file ${filename}:`, error);
    }
  }

  // Public methods for manual processing
  public async processFileManually(filename: string, userId?: string): Promise<FileProcessResult> {
    const filePath = path.join(this.config.watchDirectory, filename);
    
    if (!fs.existsSync(filePath)) {
      return {
        filePath,
        success: false,
        error: 'File not found'
      };
    }
    
    try {
      const session = await ClaudeCodeParser.parseConversationFile(filePath);
      
      if (!session) {
        throw new Error('Failed to parse conversation file');
      }
      
      if (userId) {
        session.user_id = userId;
      }
      
      return {
        filePath,
        success: true,
        messageCount: session.total_messages
      };
      
    } catch (error) {
      return {
        filePath,
        success: false,
        error: error instanceof Error ? error.message : 'Unknown error'
      };
    }
  }

  public getMonitoringStatus(): {
    isMonitoring: boolean;
    watchDirectory: string;
    processedCount: number;
  } {
    return {
      isMonitoring: this.isMonitoring,
      watchDirectory: this.config.watchDirectory,
      processedCount: this.processedFiles.size
    };
  }
}

// Default file monitor instance
export const defaultFileMonitor = new FileMonitor({
  watchDirectory: path.join(process.cwd(), '.specstory', 'history'),
  filePatterns: ['*.md', '*.json'],
  autoImport: true,
  defaultUserId: null, // Will be set when we have a user context
  processedDirectory: path.join(process.cwd(), '.specstory', 'processed'),
  errorDirectory: path.join(process.cwd(), '.specstory', 'errors')
});