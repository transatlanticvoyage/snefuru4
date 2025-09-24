const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('electronAPI', {
  runBlumenthalSync: () => ipcRenderer.invoke('run-blumenthal-sync'),
  getDirectoryInfo: () => ipcRenderer.invoke('get-directory-info')
});