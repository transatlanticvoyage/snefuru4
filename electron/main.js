const { app, BrowserWindow, ipcMain, dialog, shell } = require('electron');
const path = require('path');
const fs = require('fs').promises;
const { exec } = require('child_process');

let mainWindow;
let nextJsServer;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      contextIsolation: true,
      nodeIntegration: false
    },
    icon: path.join(__dirname, 'icon.png') // Add your icon
  });

  // In development, load from localhost
  if (process.env.NODE_ENV === 'development') {
    mainWindow.loadURL('http://localhost:3000/admin/filegun');
  } else {
    // In production, you'd bundle your Next.js app
    mainWindow.loadURL(`file://${path.join(__dirname, '../out/admin/filegun.html')}`);
  }

  mainWindow.on('closed', () => {
    mainWindow = null;
  });
}

app.whenReady().then(() => {
  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

// File System APIs (replaces your WebSocket bridge)
ipcMain.handle('fs:readDir', async (event, dirPath) => {
  try {
    const files = await fs.readdir(dirPath, { withFileTypes: true });
    return files.map(file => ({
      name: file.name,
      isDirectory: file.isDirectory(),
      path: path.join(dirPath, file.name)
    }));
  } catch (error) {
    throw new Error(`Failed to read directory: ${error.message}`);
  }
});

ipcMain.handle('fs:createFolder', async (event, folderPath) => {
  try {
    await fs.mkdir(folderPath, { recursive: true });
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to create folder: ${error.message}`);
  }
});

ipcMain.handle('fs:createFile', async (event, filePath, content = '') => {
  try {
    await fs.writeFile(filePath, content);
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to create file: ${error.message}`);
  }
});

ipcMain.handle('fs:openFile', async (event, filePath, appName) => {
  try {
    if (appName) {
      // Open with specific application
      if (process.platform === 'darwin') {
        exec(`open -a "${appName}" "${filePath}"`);
      } else if (process.platform === 'win32') {
        exec(`start "" "${appName}" "${filePath}"`);
      } else {
        // Linux - try xdg-open
        exec(`xdg-open "${filePath}"`);
      }
    } else {
      // Open with system default
      shell.openPath(filePath);
    }
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to open file: ${error.message}`);
  }
});

ipcMain.handle('fs:deleteItem', async (event, itemPath) => {
  try {
    const stats = await fs.stat(itemPath);
    if (stats.isDirectory()) {
      await fs.rmdir(itemPath, { recursive: true });
    } else {
      await fs.unlink(itemPath);
    }
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to delete item: ${error.message}`);
  }
});

ipcMain.handle('fs:renameItem', async (event, oldPath, newPath) => {
  try {
    await fs.rename(oldPath, newPath);
    return { success: true };
  } catch (error) {
    throw new Error(`Failed to rename item: ${error.message}`);
  }
});