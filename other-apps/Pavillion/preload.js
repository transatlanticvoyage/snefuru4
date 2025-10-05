const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  selectFolder: () => ipcRenderer.invoke('select-folder'),
  getFolderContents: (folderPath) => ipcRenderer.invoke('get-folder-contents', folderPath),
  openInFinder: (folderPath) => ipcRenderer.invoke('open-in-finder', folderPath),
  openFolder: (folderPath) => ipcRenderer.invoke('open-folder', folderPath),
  saveConfig: (config) => ipcRenderer.invoke('save-config', config),
  loadConfig: () => ipcRenderer.invoke('load-config'),
  removeFolder: (data) => ipcRenderer.invoke('remove-folder', data),
  getFolderInfo: (folderPath) => ipcRenderer.invoke('get-folder-info', folderPath),
  getDownloadsPath: () => ipcRenderer.invoke('get-downloads-path'),
  getDirectoryContents: (dirPath) => ipcRenderer.invoke('get-directory-contents', dirPath),
  getFileInfo: (filePath) => ipcRenderer.invoke('get-file-info', filePath),
  openFile: (filePath) => ipcRenderer.invoke('open-file', filePath),
  getSpecialPath: (pathType) => ipcRenderer.invoke('get-special-path', pathType),
  createFolder: (parentPath, folderName) => ipcRenderer.invoke('create-folder', parentPath, folderName),
  deleteFile: (filePath) => ipcRenderer.invoke('delete-file', filePath),
  confirmDelete: (count) => ipcRenderer.invoke('confirm-delete', count),
  checkPathExists: (pathToCheck) => ipcRenderer.invoke('check-path-exists', pathToCheck),
  getAvailableCloudStorage: () => ipcRenderer.invoke('get-available-cloud-storage'),
  copyFiles: (filePaths) => ipcRenderer.invoke('copy-files', filePaths),
  pasteFiles: (destinationPath) => ipcRenderer.invoke('paste-files', destinationPath),
  moveFiles: (filePaths, destinationPath) => ipcRenderer.invoke('move-files', filePaths, destinationPath),
  
  // Jupiter file handler
  onJupiterFileSelected: (callback) => ipcRenderer.on('jupiter-file-selected', (event, filePath) => callback(filePath)),
  checkGazeboTempFile: () => ipcRenderer.invoke('check-gazebo-temp-file'),
  checkFileStatus: (filePath) => ipcRenderer.invoke('check-file-status', filePath)
});