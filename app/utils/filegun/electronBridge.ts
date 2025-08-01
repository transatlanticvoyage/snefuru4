// Electron Bridge - drop-in replacement for websocketBridge when running in Electron

interface ElectronAPI {
  fs: {
    readDir: (path: string) => Promise<any[]>;
    createFolder: (path: string) => Promise<{ success: boolean }>;
    createFile: (path: string, content: string) => Promise<{ success: boolean }>;
    openFile: (path: string, appName?: string) => Promise<{ success: boolean }>;
    deleteItem: (path: string) => Promise<{ success: boolean }>;
    renameItem: (oldPath: string, newPath: string) => Promise<{ success: boolean }>;
  };
}

declare global {
  interface Window {
    electronAPI?: ElectronAPI;
  }
}

class ElectronFilegunBridge {
  isConnected(): boolean {
    return !!window.electronAPI;
  }

  async connect(): Promise<void> {
    if (!window.electronAPI) {
      throw new Error('Not running in Electron environment');
    }
  }

  disconnect(): void {
    // No-op for Electron
  }

  async openFile(filePath: string, appName?: string): Promise<boolean> {
    if (!window.electronAPI) return false;
    
    try {
      const result = await window.electronAPI.fs.openFile(filePath, appName);
      return result.success;
    } catch (error) {
      console.error('Failed to open file:', error);
      return false;
    }
  }
}

// Singleton instance
let electronBridge: ElectronFilegunBridge | null = null;

export function getFilegunBridge(): ElectronFilegunBridge {
  if (!electronBridge) {
    electronBridge = new ElectronFilegunBridge();
  }
  return electronBridge;
}

// API adapter for your existing code
export function isElectron(): boolean {
  return !!window.electronAPI;
}