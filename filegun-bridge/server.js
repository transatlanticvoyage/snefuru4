const WebSocket = require('ws');
const { exec } = require('child_process');
const fs = require('fs');
const path = require('path');

console.log('🔫 Filegun Bridge Server Starting...');

// Create WebSocket server
const wss = new WebSocket.Server({ 
  port: 8765,
  host: 'localhost' // Only accept local connections for security
});

console.log('✅ Filegun Bridge running on ws://localhost:8765');
console.log('🔒 Security: Only accepting connections from localhost');
console.log('📁 Ready to open files from Filegun UI');
console.log('');

// Smart file routing based on extension
const getAppCommand = (filePath) => {
  const ext = path.extname(filePath).toLowerCase();
  
  const appPreferences = {
    // Development files - VS Code
    '.js': 'code',
    '.ts': 'code', 
    '.jsx': 'code',
    '.tsx': 'code',
    '.py': 'code',
    '.html': 'code',
    '.css': 'code',
    '.scss': 'code',
    '.json': 'code',
    '.md': 'code',
    '.txt': 'code',
    '.php': 'code',
    '.sql': 'code',
    '.yml': 'code',
    '.yaml': 'code',
    '.env': 'code',
    '.gitignore': 'code',
    
    // Spreadsheets - Excel
    '.xlsx': 'open -a "Microsoft Excel"',
    '.xls': 'open -a "Microsoft Excel"',
    '.csv': 'open -a "Microsoft Excel"',
    
    // Images - Preview/default
    '.png': 'open',
    '.jpg': 'open',
    '.jpeg': 'open',
    '.gif': 'open',
    '.bmp': 'open',
    '.tiff': 'open',
    '.svg': 'code', // SVG in VS Code for editing
    
    // Documents
    '.pdf': 'open',
    '.doc': 'open',
    '.docx': 'open',
    '.ppt': 'open',
    '.pptx': 'open',
    
    // Audio/Video
    '.mp3': 'open',
    '.mp4': 'open',
    '.mov': 'open',
    '.avi': 'open',
    '.wav': 'open',
  };
  
  return appPreferences[ext] || 'code'; // Default to VS Code
};

// Execute command with proper error handling
const executeCommand = (command, callback) => {
  exec(command, (error, stdout, stderr) => {
    if (error) {
      console.error(`❌ Command failed: ${command}`);
      console.error(`Error: ${error.message}`);
      callback({ success: false, error: error.message });
      return;
    }
    
    console.log(`✅ Command executed: ${command}`);
    callback({ success: true, stdout, stderr });
  });
};

// Handle WebSocket connections
wss.on('connection', (ws, req) => {
  const clientIP = req.socket.remoteAddress;
  console.log(`🔌 New connection from ${clientIP}`);
  
  // Security check - only allow localhost
  if (clientIP !== '127.0.0.1' && clientIP !== '::1' && clientIP !== '::ffff:127.0.0.1') {
    console.warn(`⚠️  Rejecting connection from ${clientIP} - not localhost`);
    ws.close(1008, 'Only localhost connections allowed');
    return;
  }
  
  ws.on('message', (message) => {
    try {
      const data = JSON.parse(message.toString());
      console.log(`📨 Received message:`, data);
      
      const { action, filePath, options = {} } = data;
      
      // Validate required fields
      if (!action || !filePath) {
        ws.send(JSON.stringify({ 
          success: false, 
          error: 'Missing required fields: action, filePath' 
        }));
        return;
      }
      
      // Convert relative path to absolute path
      // If the path starts with /, it's relative to the project root
      let absolutePath = filePath;
      console.log(`🔍 Checking path: ${filePath}`);
      console.log(`🔍 Starts with /: ${filePath.startsWith('/')}`);
      console.log(`🔍 Starts with /Users: ${filePath.startsWith('/Users')}`);
      
      if (filePath.startsWith('/') && !filePath.startsWith('/Users')) {
        // Get the project root (parent directory of filegun-bridge)
        const projectRoot = path.resolve(__dirname, '..');
        // Remove leading slash and join with project root
        absolutePath = path.join(projectRoot, filePath.substring(1));
        console.log(`📁 Resolved path: ${filePath} → ${absolutePath}`);
      }
      
      // Security check - ensure file exists
      if (!fs.existsSync(absolutePath)) {
        console.warn(`⚠️  File not found: ${absolutePath}`);
        ws.send(JSON.stringify({ 
          success: false, 
          error: `File not found: ${filePath}` 
        }));
        return;
      }
      
      switch (action) {
        case 'open':
          // Open file with appropriate application
          const appCommand = getAppCommand(absolutePath);
          console.log(`📂 Opening file: ${absolutePath}`);
          console.log(`🚀 Using command: ${appCommand}`);
          
          if (appCommand === 'code') {
            executeCommand(`code "${absolutePath}"`, (result) => {
              ws.send(JSON.stringify(result));
            });
          } else if (appCommand.startsWith('open -a')) {
            executeCommand(`${appCommand} "${absolutePath}"`, (result) => {
              ws.send(JSON.stringify(result));
            });
          } else {
            executeCommand(`${appCommand} "${absolutePath}"`, (result) => {
              ws.send(JSON.stringify(result));
            });
          }
          break;
          
        case 'reveal':
          // Reveal file in Finder
          console.log(`👁️  Revealing file in Finder: ${absolutePath}`);
          executeCommand(`open -R "${absolutePath}"`, (result) => {
            ws.send(JSON.stringify(result));
          });
          break;
          
        case 'vscode':
          // Force open in VS Code
          console.log(`💻 Opening in VS Code: ${absolutePath}`);
          executeCommand(`code "${absolutePath}"`, (result) => {
            ws.send(JSON.stringify(result));
          });
          break;
          
        case 'folder':
          // Open folder in Finder
          console.log(`📁 Opening folder: ${absolutePath}`);
          executeCommand(`open "${absolutePath}"`, (result) => {
            ws.send(JSON.stringify(result));
          });
          break;
          
        default:
          ws.send(JSON.stringify({ 
            success: false, 
            error: `Unknown action: ${action}` 
          }));
      }
      
    } catch (error) {
      console.error('❌ Error processing message:', error);
      ws.send(JSON.stringify({ 
        success: false, 
        error: `Invalid message format: ${error.message}` 
      }));
    }
  });
  
  ws.on('close', (code, reason) => {
    console.log(`🔌 Connection closed: ${code} ${reason}`);
  });
  
  ws.on('error', (error) => {
    console.error('❌ WebSocket error:', error);
  });
  
  // Send welcome message
  ws.send(JSON.stringify({ 
    type: 'welcome',
    message: 'Connected to Filegun Bridge',
    version: '1.0.0'
  }));
});

// Graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down Filegun Bridge...');
  wss.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

console.log('Press Ctrl+C to stop the server');