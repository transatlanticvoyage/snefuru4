const { app, BrowserWindow, ipcMain, dialog, Menu, shell, globalShortcut } = require('electron');
const path = require('path');
const fs = require('fs');

let mainWindow;
let userDataPath;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    minWidth: 1200,
    minHeight: 600,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#f5f5f5',
    icon: path.join(__dirname, 'assets/icon.png')
  });

  mainWindow.loadFile('index.html');

  if (process.argv.includes('--dev')) {
    mainWindow.webContents.openDevTools();
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  userDataPath = path.join(app.getPath('userData'), 'pavilion-config.json');
  
  // Register custom protocol for Gazebo helper
  app.setAsDefaultProtocolClient('pavilion');
  
  // Set dock icon for development
  if (process.platform === 'darwin') {
    const iconPath = path.join(__dirname, 'assets/icon.png');
    try {
      app.dock.setIcon(iconPath);
    } catch (error) {
      console.log('Could not set dock icon:', error.message);
    }
  }
  
  createWindow();
  
  // Handle dock icon drag and drop
  app.on('open-file', (event, filePath) => {
    event.preventDefault();
    console.log('File dropped on dock icon:', filePath);
    
    // Create window if it doesn't exist
    if (!mainWindow) {
      createWindow();
    }
    
    // Wait for window to be ready, then send file info
    if (mainWindow) {
      if (mainWindow.webContents.isLoading()) {
        mainWindow.webContents.once('did-finish-load', () => {
          mainWindow.webContents.send('meridian-file-dropped', filePath);
        });
      } else {
        mainWindow.webContents.send('meridian-file-dropped', filePath);
      }
      
      mainWindow.show();
      mainWindow.focus();
    }
  });
  
  // Register F9 global hotkey for Jupiter file selection
  setTimeout(() => {
    const success = globalShortcut.register('F9', () => {
      handleJupiterHotkey();
    });
    
    if (success) {
      console.log('Global shortcut F9 registered successfully for Jupiter');
    } else {
      console.log('Failed to register global shortcut F9');
    }
  }, 1000);

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  // Unregister global shortcuts
  globalShortcut.unregisterAll();
  // Quit app completely when window closes (even on macOS)
  app.quit();
});

function handleJupiterHotkey() {
  console.log('Jupiter hotkey triggered!');
  
  // Get selected file from Finder using AppleScript
  const { exec } = require('child_process');
  const script = `
    tell application "Finder"
      try
        set selectedItems to selection
        if (count of selectedItems) > 0 then
          set firstItem to item 1 of selectedItems
          return POSIX path of (firstItem as alias)
        else
          return ""
        end if
      on error
        return ""
      end try
    end tell
  `;
  
  exec(`osascript -e '${script}'`, (error, stdout, stderr) => {
    if (error) {
      console.error('Error getting Finder selection:', error);
      return;
    }
    
    const filePath = stdout.trim();
    if (filePath && mainWindow) {
      console.log('Selected file:', filePath);
      // Switch to Jupiter tab and set the file
      mainWindow.webContents.send('jupiter-file-selected', filePath);
      
      // Bring Pavilion to front
      mainWindow.show();
      mainWindow.focus();
      app.focus();
    } else {
      console.log('No file selected in Finder');
    }
  });
}

// Handle custom protocol (from Gazebo helper)
app.on('open-url', (event, url) => {
  event.preventDefault();
  console.log('Received URL:', url);
  
  if (url.startsWith('pavilion://jupiter-file')) {
    const urlParams = new URL(url);
    const filePath = urlParams.searchParams.get('path');
    
    if (filePath && mainWindow) {
      // Switch to Jupiter tab and set the file
      mainWindow.webContents.send('jupiter-file-selected', filePath);
    }
  } else if (url.startsWith('pavilion://add-to-stream')) {
    const urlObj = new URL(url);
    const streamNumber = parseInt(urlObj.searchParams.get('stream'));
    const itemsParam = urlObj.searchParams.get('items');
    
    console.log('Gazebo stream request - Stream:', streamNumber, 'Items param:', itemsParam);
    
    if (streamNumber && itemsParam) {
      const items = decodeURIComponent(itemsParam).split('|').map(path => ({
        name: path.split('/').pop(),
        path: path
      }));
      
      console.log('Processed items:', items);
      
      // Send to renderer
      if (mainWindow) {
        mainWindow.webContents.send('gazebo-add-to-stream', {
          streamNumber,
          action: 'addToStream',
          items
        });
      }
    }
  }
});

ipcMain.handle('select-folder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'multiSelections']
  });
  
  if (!result.canceled) {
    return result.filePaths;
  }
  return null;
});

ipcMain.handle('get-folder-contents', async (event, folderPath) => {
  try {
    const items = await fs.promises.readdir(folderPath, { withFileTypes: true });
    return items
      .filter(item => item.isDirectory())
      .map(item => ({
        name: item.name,
        path: path.join(folderPath, item.name)
      }));
  } catch (error) {
    console.error('Error reading folder:', error);
    return [];
  }
});

ipcMain.handle('open-in-finder', async (event, folderPath) => {
  shell.showItemInFolder(folderPath);
});

ipcMain.handle('open-folder', async (event, folderPath) => {
  shell.openPath(folderPath);
});

ipcMain.handle('save-config', async (event, config) => {
  try {
    await fs.promises.writeFile(userDataPath, JSON.stringify(config, null, 2));
    return true;
  } catch (error) {
    console.error('Error saving config:', error);
    return false;
  }
});

ipcMain.handle('load-config', async () => {
  try {
    if (fs.existsSync(userDataPath)) {
      const data = await fs.promises.readFile(userDataPath, 'utf-8');
      return JSON.parse(data);
    }
  } catch (error) {
    console.error('Error loading config:', error);
  }
  return null;
});

ipcMain.handle('remove-folder', async (event, { sidebarId, folderPath }) => {
  return true;
});

ipcMain.handle('get-folder-info', async (event, folderPath) => {
  try {
    const stats = await fs.promises.stat(folderPath);
    const items = await fs.promises.readdir(folderPath);
    return {
      itemCount: items.length,
      modified: stats.mtime
    };
  } catch (error) {
    console.error('Error getting folder info:', error);
    return null;
  }
});

ipcMain.handle('get-downloads-path', async () => {
  return app.getPath('downloads');
});

ipcMain.handle('get-directory-contents', async (event, dirPath) => {
  try {
    const items = await fs.promises.readdir(dirPath, { withFileTypes: true });
    const contents = await Promise.all(
      items.map(async (item) => {
        const itemPath = path.join(dirPath, item.name);
        try {
          const stats = await fs.promises.stat(itemPath);
          return {
            name: item.name,
            path: itemPath,
            isDirectory: item.isDirectory(),
            size: stats.size,
            modified: stats.mtime,
            created: stats.birthtime
          };
        } catch (error) {
          return {
            name: item.name,
            path: itemPath,
            isDirectory: item.isDirectory(),
            size: 0,
            modified: new Date(),
            created: new Date()
          };
        }
      })
    );
    
    contents.sort((a, b) => {
      if (a.isDirectory === b.isDirectory) {
        return a.name.localeCompare(b.name);
      }
      return a.isDirectory ? -1 : 1;
    });
    
    return contents;
  } catch (error) {
    console.error('Error reading directory:', error);
    return [];
  }
});

ipcMain.handle('get-file-info', async (event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);
    return {
      size: stats.size,
      modified: stats.mtime,
      created: stats.birthtime,
      isDirectory: stats.isDirectory()
    };
  } catch (error) {
    console.error('Error getting file info:', error);
    return null;
  }
});

ipcMain.handle('open-file', async (event, filePath) => {
  shell.openPath(filePath);
});

ipcMain.handle('get-special-path', async (event, pathType) => {
  const homePath = app.getPath('home');
  
  switch(pathType) {
    case 'home':
      return homePath;
    case 'desktop':
      return app.getPath('desktop');
    case 'documents':
      return app.getPath('documents');
    case 'downloads':
      return app.getPath('downloads');
    case 'applications':
      return '/Applications';
    case 'dropbox':
      return path.join(homePath, 'Dropbox');
    case 'google-drive':
      return path.join(homePath, 'Google Drive');
    case 'onedrive':
      return path.join(homePath, 'OneDrive');
    case 'icloud':
      return path.join(homePath, 'Library/Mobile Documents/com~apple~CloudDocs');
    default:
      return homePath;
  }
});

ipcMain.handle('create-folder', async (event, parentPath, folderName) => {
  try {
    const newPath = path.join(parentPath, folderName);
    await fs.promises.mkdir(newPath);
    return { success: true, path: newPath };
  } catch (error) {
    console.error('Error creating folder:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('delete-file', async (event, filePath) => {
  try {
    const stats = await fs.promises.stat(filePath);
    if (stats.isDirectory()) {
      await fs.promises.rmdir(filePath, { recursive: true });
    } else {
      await fs.promises.unlink(filePath);
    }
    return { success: true };
  } catch (error) {
    console.error('Error deleting file:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('confirm-delete', async (event, count) => {
  const result = await dialog.showMessageBox(mainWindow, {
    type: 'warning',
    buttons: ['Delete', 'Cancel'],
    defaultId: 1,
    message: `Are you sure you want to delete ${count} item${count > 1 ? 's' : ''}?`,
    detail: 'This action cannot be undone.'
  });
  return result.response === 0;
});

ipcMain.handle('check-path-exists', async (event, pathToCheck) => {
  try {
    await fs.promises.access(pathToCheck);
    return true;
  } catch (error) {
    return false;
  }
});

ipcMain.handle('get-available-cloud-storage', async () => {
  const homePath = app.getPath('home');
  const cloudServices = [
    { id: 'dropbox', name: '📦 Dropbox', path: path.join(homePath, 'Dropbox') },
    { id: 'google-drive', name: '🔵 Google Drive', path: path.join(homePath, 'Google Drive') },
    { id: 'onedrive', name: '☁️ OneDrive', path: path.join(homePath, 'OneDrive') },
    { id: 'icloud', name: '☁️ iCloud Drive', path: path.join(homePath, 'Library/Mobile Documents/com~apple~CloudDocs') }
  ];
  
  const availableServices = [];
  
  for (const service of cloudServices) {
    try {
      await fs.promises.access(service.path);
      availableServices.push(service);
    } catch (error) {
      // Service not available, skip it
    }
  }
  
  return availableServices;
});

ipcMain.handle('copy-files', async (event, filePaths) => {
  try {
    const { spawn } = require('child_process');
    const script = `
      set filePaths to {${filePaths.map(p => `"${p}"`).join(', ')}}
      set fileList to {}
      repeat with filePath in filePaths
        set fileList to fileList & (POSIX file filePath)
      end repeat
      set the clipboard to fileList
    `;
    
    return new Promise((resolve) => {
      const osascript = spawn('osascript', ['-e', script]);
      osascript.on('close', (code) => {
        resolve({ success: code === 0 });
      });
    });
  } catch (error) {
    console.error('Error copying files:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('paste-files', async (event, destinationPath) => {
  try {
    const { spawn } = require('child_process');
    const script = `
      set destinationPath to "${destinationPath}"
      tell application "Finder"
        try
          duplicate (the clipboard) to folder (POSIX file destinationPath as alias)
          return "success"
        on error errMsg
          return "error: " & errMsg
        end try
      end tell
    `;
    
    return new Promise((resolve) => {
      const osascript = spawn('osascript', ['-e', script]);
      osascript.on('close', (code) => {
        resolve({ success: code === 0 });
      });
    });
  } catch (error) {
    console.error('Error pasting files:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('paste-files-m2', async (event, destinationPath) => {
  try {
    const { exec, spawn } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Method 2: Search for files by filename in common locations
    try {
      const { stdout: clipboardText } = await execAsync('pbpaste');
      const filename = clipboardText.trim();
      
      console.log('M2 Clipboard filename:', filename);
      
      if (filename && filename.length > 0 && !filename.includes('\n')) {
        // Search for this file in common locations
        const searchPaths = [
          app.getPath('downloads'),
          app.getPath('desktop'), 
          app.getPath('documents'),
          app.getPath('home')
        ];
        
        console.log('M2 Searching for file:', filename);
        
        for (const searchPath of searchPaths) {
          try {
            const { stdout: findResult } = await execAsync(`find "${searchPath}" -name "${filename}" -type f 2>/dev/null | head -1`);
            const foundPath = findResult.trim();
            
            if (foundPath) {
              console.log('M2 Found file at:', foundPath);
              
              // Copy the found file to destination
              const copyScript = `
                set sourcePath to "${foundPath}"
                set destinationPath to "${destinationPath}"
                tell application "Finder"
                  try
                    set sourceFile to POSIX file sourcePath as alias
                    set targetFolder to folder (POSIX file destinationPath as alias)
                    duplicate sourceFile to targetFolder
                    return "success"
                  on error errMsg
                    return "error: " & errMsg
                  end try
                end tell
              `;
              
              return new Promise((resolve) => {
                const copyProcess = spawn('osascript', ['-e', copyScript]);
                let copyOutput = '';
                
                copyProcess.stdout.on('data', (data) => {
                  copyOutput += data.toString();
                });
                
                copyProcess.on('close', (code) => {
                  console.log('M2 Copy result:', copyOutput.trim());
                  
                  if (copyOutput.includes('success')) {
                    resolve({ success: true });
                  } else {
                    resolve({ success: false, error: `Failed to copy file: ${copyOutput.trim()}` });
                  }
                });
              });
            }
          } catch (error) {
            // Continue searching in other locations
            continue;
          }
        }
        
        return { success: false, error: `File "${filename}" not found in common locations` };
      }
      
      return { success: false, error: 'No valid filename found in clipboard' };
      
    } catch (error) {
      console.error('Error reading clipboard:', error);
      return { success: false, error: 'Failed to read clipboard' };
    }
  } catch (error) {
    console.error('Error pasting files:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('move-files', async (event, filePaths, destinationPath) => {
  try {
    const { spawn } = require('child_process');
    const script = `
      set filePaths to {${filePaths.map(p => `"${p}"`).join(', ')}}
      set destinationPath to "${destinationPath}"
      tell application "Finder"
        repeat with filePath in filePaths
          move (POSIX file filePath) to POSIX file destinationPath
        end repeat
      end tell
    `;
    
    return new Promise((resolve) => {
      const osascript = spawn('osascript', ['-e', script]);
      osascript.on('close', (code) => {
        resolve({ success: code === 0 });
      });
    });
  } catch (error) {
    console.error('Error moving files:', error);
    return { success: false, error: error.message };
  }
});

ipcMain.handle('check-gazebo-temp-file', async () => {
  const os = require('os');
  const tempFilePath = path.join(os.tmpdir(), 'gazebo-selected-file.txt');
  
  try {
    if (fs.existsSync(tempFilePath)) {
      const filePath = fs.readFileSync(tempFilePath, 'utf8').trim();
      // Delete the temp file after reading
      fs.unlinkSync(tempFilePath);
      return filePath;
    }
    return null;
  } catch (error) {
    console.error('Error reading Gazebo temp file:', error);
    return null;
  }
});

ipcMain.handle('check-file-status', async (event, filePath) => {
  try {
    const { exec } = require('child_process');
    const util = require('util');
    const execAsync = util.promisify(exec);
    
    // Use lsof to check if file is open
    const { stdout } = await execAsync(`lsof "${filePath}" 2>/dev/null || echo "NOT_OPEN"`);
    
    if (stdout.trim() === 'NOT_OPEN') {
      return {
        isOpen: false,
        status: 'Available',
        details: 'File is not currently open by any application'
      };
    } else {
      // Parse lsof output to get application names
      const lines = stdout.trim().split('\n');
      const apps = new Set();
      
      for (let i = 1; i < lines.length; i++) { // Skip header line
        const parts = lines[i].split(/\s+/);
        if (parts[0] && parts[0] !== 'COMMAND') {
          apps.add(parts[0]);
        }
      }
      
      return {
        isOpen: true,
        status: 'In Use',
        details: `File is open in: ${Array.from(apps).join(', ')}`
      };
    }
  } catch (error) {
    console.error('Error checking file status:', error);
    return {
      isOpen: null,
      status: 'Unknown',
      details: 'Could not determine file status'
    };
  }
});

