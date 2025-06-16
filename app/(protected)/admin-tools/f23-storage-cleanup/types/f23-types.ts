export interface F23FolderResult {
  folder: string;
  fileCount: number;
  totalSize: number;
  status: 'success' | 'error' | 'empty';
  message?: string;
  filePaths?: string[];
}

export interface F23OperationResult {
  mode: string;
  folders: F23FolderResult[];
  totalFilesProcessed: number;
  totalSizeProcessed: number;
}

export type F23DeletionMode = 'preview' | 'trash' | 'permanent';

export interface F23ApiRequest {
  f23_folders: string[];
  f23_mode: F23DeletionMode;
}

export interface F23ApiResponse {
  success: boolean;
  f23_results: F23OperationResult;
  f23_log: string[];
}