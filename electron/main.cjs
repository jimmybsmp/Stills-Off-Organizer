const { app, BrowserWindow, ipcMain, dialog, shell, protocol, safeStorage } = require('electron');
const path = require('node:path');
const fs = require('node:fs');
const fsp = require('node:fs/promises');

const isDev = !app.isPackaged;
const userDataDir = app.getPath('userData');
const dataFile = path.join(userDataDir, 'stillsoff-data.json');
const assetsDir = path.join(userDataDir, 'assets');

function ensureDirSync(dir) {
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
}
ensureDirSync(assetsDir);

let mainWindow;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1280,
    height: 860,
    minWidth: 960,
    minHeight: 640,
    backgroundColor: '#1b1d21',
    webPreferences: {
      preload: path.join(__dirname, 'preload.cjs'),
      contextIsolation: true,
      nodeIntegration: false,
      sandbox: false,
    },
  });

  if (isDev) {
    mainWindow.loadURL('http://localhost:5173');
    mainWindow.webContents.openDevTools({ mode: 'detach' });
  } else {
    mainWindow.loadFile(path.join(__dirname, '..', 'dist', 'index.html'));
  }
}

app.whenReady().then(() => {
  protocol.registerFileProtocol('stillsoff-asset', (request, callback) => {
    const name = decodeURIComponent(request.url.replace('stillsoff-asset://', '').split('?')[0]);
    const filePath = path.join(assetsDir, name);
    if (!filePath.startsWith(assetsDir)) {
      callback({ error: -10 });
      return;
    }
    callback({ path: filePath });
  });

  createWindow();

  app.on('activate', () => {
    if (BrowserWindow.getAllWindows().length === 0) createWindow();
  });
});

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') app.quit();
});

// --- data persistence -------------------------------------------------

ipcMain.handle('data:read', async () => {
  try {
    const raw = await fsp.readFile(dataFile, 'utf-8');
    return raw;
  } catch (err) {
    if (err.code === 'ENOENT') return null;
    throw err;
  }
});

ipcMain.handle('data:write', async (_evt, json) => {
  const tmp = dataFile + '.tmp';
  await fsp.writeFile(tmp, json, 'utf-8');
  await fsp.rename(tmp, dataFile);
  return true;
});

// --- filesystem / shell helpers ---------------------------------------

ipcMain.handle('fs:pathExists', async (_evt, targetPath) => {
  try {
    await fsp.access(targetPath);
    return true;
  } catch {
    return false;
  }
});

ipcMain.handle('fs:ensureDir', async (_evt, targetPath) => {
  await fsp.mkdir(targetPath, { recursive: true });
  return true;
});

ipcMain.handle('fs:copyFile', async (_evt, src, dest) => {
  await fsp.mkdir(path.dirname(dest), { recursive: true });
  let finalDest = dest;
  if (fs.existsSync(finalDest)) {
    const ext = path.extname(dest);
    const base = dest.slice(0, dest.length - ext.length);
    let n = 2;
    while (fs.existsSync(`${base} ${n}${ext}`)) n += 1;
    finalDest = `${base} ${n}${ext}`;
  }
  await fsp.copyFile(src, finalDest);
  return finalDest;
});

ipcMain.handle('shell:openPath', async (_evt, targetPath) => {
  const err = await shell.openPath(targetPath);
  return err || null;
});

ipcMain.handle('shell:openExternal', async (_evt, url) => {
  await shell.openExternal(url);
  return true;
});

ipcMain.handle('dialog:pickFile', async (_evt, filters) => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openFile'],
    filters: filters || [],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:pickFolder', async () => {
  const result = await dialog.showOpenDialog(mainWindow, {
    properties: ['openDirectory', 'createDirectory'],
  });
  if (result.canceled || result.filePaths.length === 0) return null;
  return result.filePaths[0];
});

ipcMain.handle('dialog:pickSavePath', async (_evt, defaultName) => {
  const result = await dialog.showSaveDialog(mainWindow, {
    defaultPath: defaultName,
  });
  if (result.canceled || !result.filePath) return null;
  return result.filePath;
});

// --- idea board assets --------------------------------------------------

ipcMain.handle('asset:write', async (_evt, hash, ext, base64) => {
  const fileName = `${hash}.${ext}`;
  const filePath = path.join(assetsDir, fileName);
  if (!fs.existsSync(filePath)) {
    await fsp.writeFile(filePath, Buffer.from(base64, 'base64'));
  }
  return fileName;
});

ipcMain.handle('asset:writeThumb', async (_evt, hash, base64) => {
  const fileName = `${hash}.thumb.jpg`;
  const filePath = path.join(assetsDir, fileName);
  await fsp.writeFile(filePath, Buffer.from(base64, 'base64'));
  return fileName;
});

ipcMain.handle('file:exportBuffer', async (_evt, filePath, base64) => {
  await fsp.mkdir(path.dirname(filePath), { recursive: true });
  await fsp.writeFile(filePath, Buffer.from(base64, 'base64'));
  return true;
});

// --- vault (safeStorage, backed by the macOS Keychain) -------------------

ipcMain.handle('vault:isAvailable', () => safeStorage.isEncryptionAvailable());

ipcMain.handle('vault:encrypt', (_evt, plainText) => {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure storage is not available on this machine.');
  return safeStorage.encryptString(plainText).toString('base64');
});

ipcMain.handle('vault:decrypt', (_evt, cipherBase64) => {
  if (!safeStorage.isEncryptionAvailable()) throw new Error('Secure storage is not available on this machine.');
  return safeStorage.decryptString(Buffer.from(cipherBase64, 'base64'));
});

// --- folder browsing -------------------------------------------------

ipcMain.handle('fs:listDir', async (_evt, targetPath) => {
  const entries = await fsp.readdir(targetPath, { withFileTypes: true });
  const files = await Promise.all(
    entries
      .filter((e) => e.isFile())
      .map(async (e) => {
        const full = path.join(targetPath, e.name);
        const stat = await fsp.stat(full);
        return { name: e.name, path: full, modifiedAt: stat.mtimeMs };
      }),
  );
  return files.sort((a, b) => b.modifiedAt - a.modifiedAt);
});

// --- backup -------------------------------------------------

ipcMain.handle('backup:run', async (_evt, destFolder) => {
  const stamp = new Date().toISOString().replace(/[:.]/g, '-').slice(0, 19);
  const target = path.join(destFolder, `StillsOff-Backup-${stamp}`);
  await fsp.cp(userDataDir, target, { recursive: true });
  return target;
});
