/**
 * WebSocket Bridge Client for Filegun
 * Connects to the local WebSocket bridge server to open files
 */

interface WebSocketMessage {
  action: 'open' | 'reveal' | 'vscode' | 'folder';
  filePath: string;
  options?: Record<string, any>;
}

interface WebSocketResponse {
  success: boolean;
  error?: string;
  type?: string;
  message?: string;
  version?: string;
}

class FilegunWebSocketBridge {
  private ws: WebSocket | null = null;
  private reconnectAttempts = 0;
  private maxReconnectAttempts = 3;
  private reconnectTimeout: NodeJS.Timeout | null = null;
  private connectionPromise: Promise<boolean> | null = null;
  private connectionResolver: ((value: boolean) => void) | null = null;

  constructor() {
    this.connect();
  }

  private connect() {
    // Create a new connection promise
    this.connectionPromise = new Promise<boolean>((resolve) => {
      this.connectionResolver = resolve;
    });

    try {
      this.ws = new WebSocket('ws://localhost:8765');
      
      this.ws.onopen = () => {
        console.log('🔫 Connected to Filegun Bridge');
        this.reconnectAttempts = 0;
        // Resolve the connection promise
        if (this.connectionResolver) {
          this.connectionResolver(true);
          this.connectionResolver = null;
        }
      };

      this.ws.onmessage = (event) => {
        try {
          const data: WebSocketResponse = JSON.parse(event.data);
          
          if (data.type === 'welcome') {
            console.log(`🔫 ${data.message} (v${data.version})`);
          } else if (!data.success && data.error) {
            console.error('🔫 Bridge error:', data.error);
            // Show user-friendly error message
            alert(`File operation failed: ${data.error}`);
          }
        } catch (error) {
          console.error('🔫 Error parsing WebSocket message:', error);
        }
      };

      this.ws.onclose = (event) => {
        console.log('🔫 Disconnected from Bridge');
        this.ws = null;
        
        // Attempt to reconnect if not intentionally closed
        if (event.code !== 1000 && this.reconnectAttempts < this.maxReconnectAttempts) {
          this.reconnectAttempts++;
          console.log(`🔫 Attempting to reconnect (${this.reconnectAttempts}/${this.maxReconnectAttempts})...`);
          
          this.reconnectTimeout = setTimeout(() => {
            this.connect();
          }, 2000);
        } else if (this.reconnectAttempts >= this.maxReconnectAttempts) {
          console.error('🔫 Failed to connect to Bridge after multiple attempts');
          alert('Could not connect to Filegun Bridge. Make sure the bridge server is running:\n\ncd filegun-bridge\nnpm start');
          // Resolve the connection promise as failed
          if (this.connectionResolver) {
            this.connectionResolver(false);
            this.connectionResolver = null;
          }
        }
      };

      this.ws.onerror = (error) => {
        console.error('🔫 WebSocket error:', error);
      };

    } catch (error) {
      console.error('🔫 Failed to create WebSocket connection:', error);
      alert('Could not connect to Filegun Bridge. Make sure the bridge server is running:\n\ncd filegun-bridge\nnpm start');
      // Resolve the connection promise as failed
      if (this.connectionResolver) {
        this.connectionResolver(false);
        this.connectionResolver = null;
      }
    }
  }

  /**
   * Open a file with the appropriate application
   */
  public openFile(filePath: string): Promise<boolean> {
    return this.sendMessage({
      action: 'open',
      filePath
    });
  }

  /**
   * Reveal a file in Finder
   */
  public revealFile(filePath: string): Promise<boolean> {
    return this.sendMessage({
      action: 'reveal',
      filePath
    });
  }

  /**
   * Force open a file in VS Code
   */
  public openInVSCode(filePath: string): Promise<boolean> {
    return this.sendMessage({
      action: 'vscode',
      filePath
    });
  }

  /**
   * Open a folder in Finder
   */
  public openFolder(filePath: string): Promise<boolean> {
    return this.sendMessage({
      action: 'folder',
      filePath
    });
  }

  private async sendMessage(message: WebSocketMessage): Promise<boolean> {
    // Wait for connection to be ready
    if (this.connectionPromise) {
      const connected = await this.connectionPromise;
      if (!connected) {
        return false;
      }
    }

    return new Promise((resolve) => {
      if (!this.ws || this.ws.readyState !== WebSocket.OPEN) {
        console.error('🔫 WebSocket not connected');
        alert('Connection to Filegun Bridge lost. Please make sure the bridge server is running.');
        resolve(false);
        return;
      }

      try {
        // Send message
        this.ws.send(JSON.stringify(message));
        
        // Set up one-time response listener
        const originalOnMessage = this.ws.onmessage;
        const timeout = setTimeout(() => {
          this.ws!.onmessage = originalOnMessage;
          console.error('🔫 Timeout waiting for bridge response');
          resolve(false);
        }, 5000);

        this.ws.onmessage = (event) => {
          clearTimeout(timeout);
          this.ws!.onmessage = originalOnMessage;
          
          try {
            const response: WebSocketResponse = JSON.parse(event.data);
            
            // Skip welcome messages
            if (response.type === 'welcome') {
              resolve(false);
              return;
            }
            
            if (response.success) {
              console.log('🔫 File operation successful');
              resolve(true);
            } else {
              console.error('🔫 File operation failed:', response.error);
              resolve(false);
            }
          } catch (error) {
            console.error('🔫 Error parsing response:', error);
            resolve(false);
          }
        };

      } catch (error) {
        console.error('🔫 Error sending message:', error);
        resolve(false);
      }
    });
  }

  /**
   * Close the WebSocket connection
   */
  public disconnect() {
    if (this.reconnectTimeout) {
      clearTimeout(this.reconnectTimeout);
      this.reconnectTimeout = null;
    }
    
    if (this.ws) {
      this.ws.close(1000, 'Client disconnect');
      this.ws = null;
    }
  }
}

// Singleton instance
let bridgeInstance: FilegunWebSocketBridge | null = null;

/**
 * Get the global WebSocket bridge instance
 */
export const getFilegunBridge = (): FilegunWebSocketBridge => {
  if (!bridgeInstance) {
    bridgeInstance = new FilegunWebSocketBridge();
  }
  return bridgeInstance;
};

/**
 * Cleanup function for when components unmount
 */
export const disconnectFilegunBridge = () => {
  if (bridgeInstance) {
    bridgeInstance.disconnect();
    bridgeInstance = null;
  }
};