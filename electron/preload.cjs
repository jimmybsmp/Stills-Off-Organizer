const { contextBridge, ipcRenderer } = require('electron');

contextBridge.exposeInMainWorld('stillsoff', {
  isDesktop: true,

  readData: () => ipcRenderer.invoke('data:read'),
  writeData: (json) => ipcRenderer.invoke('data:write', json),

  pathExists: (targetPath) => ipcRenderer.invoke('fs:pathExists', targetPath),
  ensureDir: (targetPath) => ipcRenderer.invoke('fs:ensureDir', targetPath),
  copyFile: (src, dest) => ipcRenderer.invoke('fs:copyFile', src, dest),

  openPath: (targetPath) => ipcRenderer.invoke('shell:openPath', targetPath),
  openExternal: (url) => ipcRenderer.invoke('shell:openExternal', url),

  pickFile: (filters) => ipcRenderer.invoke('dialog:pickFile', filters),
  pickFolder: () => ipcRenderer.invoke('dialog:pickFolder'),
  pickSavePath: (defaultName) => ipcRenderer.invoke('dialog:pickSavePath', defaultName),

  writeAsset: (hash, ext, base64) => ipcRenderer.invoke('asset:write', hash, ext, base64),
  writeAssetThumb: (hash, base64) => ipcRenderer.invoke('asset:writeThumb', hash, base64),
  exportBuffer: (filePath, base64) => ipcRenderer.invoke('file:exportBuffer', filePath, base64),

  assetUrl: (fileName) => `stillsoff-asset://${encodeURIComponent(fileName)}`,

  vaultIsAvailable: () => ipcRenderer.invoke('vault:isAvailable'),
  vaultEncrypt: (plainText) => ipcRenderer.invoke('vault:encrypt', plainText),
  vaultDecrypt: (cipherBase64) => ipcRenderer.invoke('vault:decrypt', cipherBase64),

  listDir: (targetPath) => ipcRenderer.invoke('fs:listDir', targetPath),

  runBackup: (destFolder) => ipcRenderer.invoke('backup:run', destFolder),
});
