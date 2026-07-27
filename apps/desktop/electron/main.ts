import { app, BrowserWindow, ipcMain, safeStorage } from 'electron';
import path from 'path';
import fs from 'fs';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

let mainWindow: BrowserWindow | null = null;

function getStoreFilePath(): string {
  const userDataPath = app.getPath('userData');
  return path.join(userDataPath, 'syncnotes_vault.bin');
}

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: 'hiddenInset',
    backgroundColor: '#1E1E1E',
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true,
    },
  });

  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname, '../dist/index.html'));
  }
}

app.whenReady().then(() => {
  // IPC handlers for OS safeStorage credential vault
  ipcMain.handle('secure-store-set', async (_, key: string, value: string) => {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        return false;
      }
      const file = getStoreFilePath();
      let storeData: Record<string, string> = {};
      if (fs.existsSync(file)) {
        try {
          const encBuf = fs.readFileSync(file);
          const decStr = safeStorage.decryptString(encBuf);
          storeData = JSON.parse(decStr);
        } catch {
          storeData = {};
        }
      }
      storeData[key] = value;
      const encrypted = safeStorage.encryptString(JSON.stringify(storeData));
      fs.writeFileSync(file, encrypted);
      return true;
    } catch (err) {
      console.error('secure-store-set error', err);
      return false;
    }
  });

  ipcMain.handle('secure-store-get', async (_, key: string) => {
    try {
      if (!safeStorage.isEncryptionAvailable()) return null;
      const file = getStoreFilePath();
      if (!fs.existsSync(file)) return null;
      const encBuf = fs.readFileSync(file);
      const decStr = safeStorage.decryptString(encBuf);
      const storeData = JSON.parse(decStr);
      return storeData[key] || null;
    } catch (err) {
      console.error('secure-store-get error', err);
      return null;
    }
  });

  ipcMain.handle('secure-store-delete', async (_, key: string) => {
    try {
      const file = getStoreFilePath();
      if (fs.existsSync(file) && safeStorage.isEncryptionAvailable()) {
        const encBuf = fs.readFileSync(file);
        const decStr = safeStorage.decryptString(encBuf);
        const storeData = JSON.parse(decStr);
        delete storeData[key];
        const encrypted = safeStorage.encryptString(JSON.stringify(storeData));
        fs.writeFileSync(file, encrypted);
      }
      return true;
    } catch {
      return false;
    }
  });

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
