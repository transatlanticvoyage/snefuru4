const { app, BrowserWindow, ipcMain } = require('electron');
const path = require('path');
const { execSync } = require('child_process');
const fs = require('fs');

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 500,
    height: 400,
    webPreferences: {
      nodeIntegration: false,
      contextIsolation: true,
      preload: path.join(__dirname, 'preload.js')
    },
    titleBarStyle: 'default',
    resizable: false,
    maximizable: false,
    title: 'TransitGun'
  });

  mainWindow.loadFile('index.html');
  
  // Remove menu bar
  mainWindow.setMenuBarVisibility(false);
}

app.whenReady().then(createWindow);

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

// Handle sync request
ipcMain.handle('run-blumenthal-sync', async () => {
  try {
    const sourcePath = '/Users/kylecampbell/Documents/repos/localrepo-snefuru4/shenzi-wordpress-plugins/grove';
    const targetPath = '/Users/kylecampbell/Documents/repos/localrepo-snefuru4/wordpress-sites/moldremovalstars.com/app/public/wp-content/plugins/grove';
    
    // Check if source exists
    if (!fs.existsSync(sourcePath)) {
      throw new Error('Source directory not found: ' + sourcePath);
    }
    
    // Create target directory if it doesn't exist
    const targetDir = path.dirname(targetPath);
    if (!fs.existsSync(targetDir)) {
      throw new Error('Target directory not found: ' + targetDir);
    }
    
    // Remove existing target if it's a directory (not a symlink)
    if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isDirectory() && !fs.lstatSync(targetPath).isSymbolicLink()) {
      execSync(`rm -rf "${targetPath}"`);
    }
    
    // Remove symlink if it exists
    if (fs.existsSync(targetPath) && fs.lstatSync(targetPath).isSymbolicLink()) {
      fs.unlinkSync(targetPath);
    }
    
    // Use rsync to copy files
    const rsyncCommand = `rsync -av --delete "${sourcePath}/" "${targetPath}/"`;
    const result = execSync(rsyncCommand, { encoding: 'utf8' });
    
    return {
      success: true,
      message: 'Blumenthal Grove sync completed successfully!',
      details: result.trim()
    };
    
  } catch (error) {
    return {
      success: false,
      message: 'Sync failed: ' + error.message,
      details: error.toString()
    };
  }
});

// Get directory info
ipcMain.handle('get-directory-info', async () => {
  const sourcePath = '/Users/kylecampbell/Documents/repos/localrepo-snefuru4/shenzi-wordpress-plugins/grove';
  const targetPath = '/Users/kylecampbell/Documents/repos/localrepo-snefuru4/wordpress-sites/moldremovalstars.com/app/public/wp-content/plugins/grove';
  
  return {
    source: sourcePath,
    target: targetPath,
    sourceExists: fs.existsSync(sourcePath),
    targetExists: fs.existsSync(targetPath)
  };
});