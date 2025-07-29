export interface SentinelFileItem {
  path: string;
  name: string;
  type: 'file' | 'folder';
  size: number;
  modified: Date;
  created: Date;
  checksum?: string;
  extension?: string;
  mimeType?: string;
  isHidden: boolean;
  permissions?: string;
}

export interface SentinelChangeEvent {
  type: 'add' | 'change' | 'unlink' | 'addDir' | 'unlinkDir';
  path: string;
  timestamp: Date;
  item?: SentinelFileItem;
}

export interface SentinelStatus {
  isActive: boolean;
  isScanning: boolean;
  lastSyncTime: Date | null;
  totalFiles: number;
  totalFolders: number;
  pendingChanges: number;
  errorCount: number;
  watchedPaths: string[];
}

export interface SentinelOperation {
  id: string;
  type: 'sync' | 'scan' | 'watch' | 'database';
  action: string;
  path: string;
  status: 'pending' | 'running' | 'completed' | 'error';
  timestamp: Date;
  error?: string;
  details?: any;
}

export interface SentinelConfig {
  enabled: boolean;
  watchPatterns: string[];
  ignorePatterns: string[];
  syncInterval: number;
  maxQueueSize: number;
  enableRealtime: boolean;
  enablePolling: boolean;
  pollingInterval: number;
  maxFileSize: number;
  batchSize: number;
}

export interface SentinelStats {
  filesWatched: number;
  foldersWatched: number;
  totalSyncOperations: number;
  successfulSyncs: number;
  failedSyncs: number;
  lastFullScanDuration: number;
  averageSyncTime: number;
  queueSize: number;
}

export interface SentinelSyncResult {
  success: boolean;
  itemsProcessed: number;
  itemsCreated: number;
  itemsUpdated: number;
  itemsDeleted: number;
  errors: string[];
  duration: number;
  timestamp: Date;
}

export type SentinelEventHandler = (event: SentinelChangeEvent) => void;
export type SentinelStatusHandler = (status: SentinelStatus) => void;
export type SentinelErrorHandler = (error: Error, operation?: SentinelOperation) => void;