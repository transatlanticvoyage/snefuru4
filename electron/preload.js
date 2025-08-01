const { contextBridge, ipcRenderer } = require('electron');

// Expose protected methods that allow the renderer process to use
// the ipcRenderer without exposing the entire object
contextBridge.exposeInMainWorld('electronAPI', {
  fs: {
    readDir: (path) => ipcRenderer.invoke('fs:readDir', path),
    createFolder: (path) => ipcRenderer.invoke('fs:createFolder', path),
    createFile: (path, content) => ipcRenderer.invoke('fs:createFile', path, content),
    openFile: (path, appName) => ipcRenderer.invoke('fs:openFile', path, appName),
    deleteItem: (path) => ipcRenderer.invoke('fs:deleteItem', path),
    renameItem: (oldPath, newPath) => ipcRenderer.invoke('fs:renameItem', oldPath, newPath),
  }
});