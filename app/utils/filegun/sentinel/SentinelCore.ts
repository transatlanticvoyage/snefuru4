import chokidar, { FSWatcher } from 'chokidar';
import { EventEmitter } from 'events';
import { SentinelFileItem, SentinelChangeEvent, SentinelStatus, SentinelOperation, SentinelSyncResult, SentinelEventHandler, SentinelStatusHandler, SentinelErrorHandler } from './SentinelTypes';
import { getSentinelConfig } from './SentinelConfig';
import { SentinelDatabase } from './SentinelDatabase';
import { SentinelScanner } from './SentinelScanner';

export class FilegunSentinel extends EventEmitter {
  private watcher: FSWatcher | null = null;
  private database: SentinelDatabase;
  private scanner: SentinelScanner;
  private config = getSentinelConfig();
  
  // State
  private isActive: boolean = false;
  private isScanning: boolean = false;
  private watchedPaths: string[] = [];
  private operationQueue: SentinelOperation[] = [];
  private stats = {
    totalFiles: 0,
    totalFolders: 0,
    syncOperations: 0,
    successfulSyncs: 0,
    failedSyncs: 0,
    lastSyncTime: null as Date | null
  };

  // Singleton instance
  private static instance: FilegunSentinel | null = null;

  constructor() {
    super();
    this.database = new SentinelDatabase();
    this.scanner = new SentinelScanner();
    
    // Prevent multiple instances
    if (FilegunSentinel.instance) {
      return FilegunSentinel.instance;
    }
    FilegunSentinel.instance = this;
  }

  // Static method to get singleton instance
  static getInstance(): FilegunSentinel {
    if (!FilegunSentinel.instance) {
      FilegunSentinel.instance = new FilegunSentinel();
    }
    return FilegunSentinel.instance;
  }

  // Start watching filesystem
  async startWatching(projectRoot: string): Promise<boolean> {
    try {
      if (this.isActive) {
        console.log('Sentinel already active');
        return true;
      }

      if (!this.config.enabled) {
        console.log('Sentinel is disabled in configuration');
        return false;
      }

      console.log(`🛡️ Starting Filegun Sentinel for: ${projectRoot}`);

      // Initialize watcher
      this.watcher = chokidar.watch(projectRoot, {
        ignored: this.config.ignorePatterns,
        persistent: true,
        ignoreInitial: false, // Don't ignore initial files
        followSymlinks: false,
        usePolling: !this.config.enableRealtime,
        interval: this.config.pollingInterval,
        awaitWriteFinish: {
          stabilityThreshold: 100,
          pollInterval: 50
        }
      });

      // Set up event handlers
      this.setupEventHandlers();

      this.isActive = true;
      this.watchedPaths = [projectRoot];

      // Emit status change
      this.emitStatusUpdate();

      console.log('✅ Filegun Sentinel started successfully');
      return true;
    } catch (error) {
      console.error('❌ Failed to start Sentinel:', error);
      this.emitError(new Error(`Failed to start Sentinel: ${error.message}`));
      return false;
    }
  }

  // Stop watching filesystem
  async stopWatching(): Promise<void> {
    try {
      if (!this.isActive) {
        return;
      }

      console.log('🛡️ Stopping Filegun Sentinel...');

      if (this.watcher) {
        await this.watcher.close();
        this.watcher = null;
      }

      this.isActive = false;
      this.watchedPaths = [];

      // Clear operation queue
      this.operationQueue = [];

      this.emitStatusUpdate();
      console.log('✅ Filegun Sentinel stopped');
    } catch (error) {
      console.error('❌ Error stopping Sentinel:', error);
      this.emitError(new Error(`Error stopping Sentinel: ${error.message}`));
    }
  }

  // Perform full directory sync
  async syncDirectory(directoryPath: string): Promise<SentinelSyncResult> {
    const operation = this.createOperation('sync', 'Full directory sync', directoryPath);
    this.isScanning = true;
    this.emitStatusUpdate();

    try {
      console.log(`🔄 Starting full sync of: ${directoryPath}`);
      
      // Scan filesystem
      const fsItems = await this.scanner.scanDirectory(directoryPath);
      
      // Batch sync to database
      const result = await this.database.batchSync(fsItems);
      
      // Update stats
      this.stats.totalFiles = fsItems.filter(item => item.type === 'file').length;
      this.stats.totalFolders = fsItems.filter(item => item.type === 'folder').length;
      this.stats.syncOperations++;
      this.stats.lastSyncTime = new Date();
      
      if (result.success) {
        this.stats.successfulSyncs++;
        this.completeOperation(operation, 'completed');
      } else {
        this.stats.failedSyncs++;
        this.completeOperation(operation, 'error', result.errors.join(', '));
      }

      console.log(`✅ Sync completed: ${result.itemsProcessed} items processed`);
      this.emitStatusUpdate();
      
      return result;
    } catch (error) {
      this.stats.failedSyncs++;
      this.completeOperation(operation, 'error', error.message);
      this.emitError(error as Error, operation);
      
      return {
        success: false,
        itemsProcessed: 0,
        itemsCreated: 0,
        itemsUpdated: 0,
        itemsDeleted: 0,
        errors: [error.message],
        duration: 0,
        timestamp: new Date()
      };
    } finally {
      this.isScanning = false;
      this.emitStatusUpdate();
    }
  }

  // Get current status
  getCurrentStatus(): SentinelStatus {
    return {
      isActive: this.isActive,
      isScanning: this.isScanning,
      lastSyncTime: this.stats.lastSyncTime,
      totalFiles: this.stats.totalFiles,
      totalFolders: this.stats.totalFolders,
      pendingChanges: this.operationQueue.filter(op => op.status === 'pending').length,
      errorCount: this.stats.failedSyncs,
      watchedPaths: [...this.watchedPaths]
    };
  }

  // Get operation history
  getOperationHistory(): SentinelOperation[] {
    return [...this.operationQueue].reverse(); // Most recent first
  }

  // Clear operation history
  clearOperationHistory(): void {
    this.operationQueue = [];
    this.emitStatusUpdate();
  }

  // Event handler setup
  private setupEventHandlers(): void {
    if (!this.watcher) return;

    this.watcher
      .on('add', (path) => this.handleFileAdded(path))
      .on('change', (path) => this.handleFileChanged(path))
      .on('unlink', (path) => this.handleFileDeleted(path))
      .on('addDir', (path) => this.handleFolderAdded(path))
      .on('unlinkDir', (path) => this.handleFolderDeleted(path))
      .on('error', (error) => this.handleWatcherError(error))
      .on('ready', () => this.handleWatcherReady());
  }

  // File system event handlers
  private async handleFileAdded(filePath: string): Promise<void> {
    const operation = this.createOperation('watch', 'File added', filePath);
    
    try {
      const item = await this.scanner.scanItem(filePath);
      if (item && item.type === 'file') {
        const success = await this.database.syncFileToDb(item);
        if (success) {
          this.completeOperation(operation, 'completed');
          this.emitChangeEvent('add', filePath, item);
        } else {
          this.completeOperation(operation, 'error', 'Failed to sync to database');
        }
      }
    } catch (error) {
      this.completeOperation(operation, 'error', error.message);
      this.emitError(error as Error, operation);
    }
  }

  private async handleFileChanged(filePath: string): Promise<void> {
    const operation = this.createOperation('watch', 'File changed', filePath);
    
    try {
      const item = await this.scanner.scanItem(filePath);
      if (item && item.type === 'file') {
        const success = await this.database.syncFileToDb(item);
        if (success) {
          this.completeOperation(operation, 'completed');
          this.emitChangeEvent('change', filePath, item);
        } else {
          this.completeOperation(operation, 'error', 'Failed to sync to database');
        }
      }
    } catch (error) {
      this.completeOperation(operation, 'error', error.message);
      this.emitError(error as Error, operation);
    }
  }

  private async handleFileDeleted(filePath: string): Promise<void> {
    const operation = this.createOperation('watch', 'File deleted', filePath);
    
    try {
      const success = await this.database.markAsDeleted(filePath, false);
      if (success) {
        this.completeOperation(operation, 'completed');
        this.emitChangeEvent('unlink', filePath);
      } else {
        this.completeOperation(operation, 'error', 'Failed to mark as deleted');
      }
    } catch (error) {
      this.completeOperation(operation, 'error', error.message);
      this.emitError(error as Error, operation);
    }
  }

  private async handleFolderAdded(folderPath: string): Promise<void> {
    const operation = this.createOperation('watch', 'Folder added', folderPath);
    
    try {
      const item = await this.scanner.scanItem(folderPath);
      if (item && item.type === 'folder') {
        const success = await this.database.syncFolderToDb(item);
        if (success) {
          this.completeOperation(operation, 'completed');
          this.emitChangeEvent('addDir', folderPath, item);
        } else {
          this.completeOperation(operation, 'error', 'Failed to sync to database');
        }
      }
    } catch (error) {
      this.completeOperation(operation, 'error', error.message);
      this.emitError(error as Error, operation);
    }
  }

  private async handleFolderDeleted(folderPath: string): Promise<void> {
    const operation = this.createOperation('watch', 'Folder deleted', folderPath);
    
    try {
      const success = await this.database.markAsDeleted(folderPath, true);
      if (success) {
        this.completeOperation(operation, 'completed');
        this.emitChangeEvent('unlinkDir', folderPath);
      } else {
        this.completeOperation(operation, 'error', 'Failed to mark as deleted');
      }
    } catch (error) {
      this.completeOperation(operation, 'error', error.message);
      this.emitError(error as Error, operation);
    }
  }

  private handleWatcherError(error: Error): void {
    console.error('Watcher error:', error);
    this.emitError(error);
  }

  private handleWatcherReady(): void {
    console.log('🛡️ Sentinel watcher ready');
    this.emit('ready');
  }

  // Utility methods
  private createOperation(type: SentinelOperation['type'], action: string, path: string): SentinelOperation {
    const operation: SentinelOperation = {
      id: `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`,
      type,
      action,
      path,
      status: 'pending',
      timestamp: new Date()
    };

    this.operationQueue.push(operation);
    
    // Keep queue size manageable
    if (this.operationQueue.length > this.config.maxQueueSize) {
      this.operationQueue.shift();
    }

    return operation;
  }

  private completeOperation(operation: SentinelOperation, status: 'completed' | 'error', error?: string): void {
    operation.status = status;
    if (error) {
      operation.error = error;
    }
  }

  private emitChangeEvent(type: SentinelChangeEvent['type'], path: string, item?: SentinelFileItem): void {
    const event: SentinelChangeEvent = {
      type,
      path,
      timestamp: new Date(),
      item
    };
    
    this.emit('change', event);
  }

  private emitStatusUpdate(): void {
    this.emit('status', this.getCurrentStatus());
  }

  private emitError(error: Error, operation?: SentinelOperation): void {
    this.emit('error', error, operation);
  }

  // Public event handler methods
  onChange(handler: SentinelEventHandler): void {
    this.on('change', handler);
  }

  onStatus(handler: SentinelStatusHandler): void {
    this.on('status', handler);
  }

  onError(handler: SentinelErrorHandler): void {
    this.on('error', handler);
  }

  // Cleanup
  async destroy(): Promise<void> {
    await this.stopWatching();
    this.removeAllListeners();
    FilegunSentinel.instance = null;
  }
}