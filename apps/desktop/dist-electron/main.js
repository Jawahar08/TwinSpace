import { app, ipcMain, safeStorage, BrowserWindow } from "electron";
import path from "path";
import fs from "fs";
import { fileURLToPath } from "url";
const __filename$1 = fileURLToPath(import.meta.url);
const __dirname$1 = path.dirname(__filename$1);
let mainWindow = null;
function getStoreFilePath() {
  const userDataPath = app.getPath("userData");
  return path.join(userDataPath, "syncnotes_vault.bin");
}
function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#1E1E1E",
    webPreferences: {
      preload: path.join(__dirname$1, "preload.js"),
      nodeIntegration: false,
      contextIsolation: true,
      sandbox: true
    }
  });
  if (process.env.VITE_DEV_SERVER_URL) {
    mainWindow.loadURL(process.env.VITE_DEV_SERVER_URL);
  } else {
    mainWindow.loadFile(path.join(__dirname$1, "../dist/index.html"));
  }
}
app.whenReady().then(() => {
  ipcMain.handle("secure-store-set", async (_, key, value) => {
    try {
      if (!safeStorage.isEncryptionAvailable()) {
        return false;
      }
      const file = getStoreFilePath();
      let storeData = {};
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
      console.error("secure-store-set error", err);
      return false;
    }
  });
  ipcMain.handle("secure-store-get", async (_, key) => {
    try {
      if (!safeStorage.isEncryptionAvailable()) return null;
      const file = getStoreFilePath();
      if (!fs.existsSync(file)) return null;
      const encBuf = fs.readFileSync(file);
      const decStr = safeStorage.decryptString(encBuf);
      const storeData = JSON.parse(decStr);
      return storeData[key] || null;
    } catch (err) {
      console.error("secure-store-get error", err);
      return null;
    }
  });
  ipcMain.handle("secure-store-delete", async (_, key) => {
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
  app.on("activate", () => {
    if (BrowserWindow.getAllWindows().length === 0) {
      createWindow();
    }
  });
});
app.on("window-all-closed", () => {
  if (process.platform !== "darwin") {
    app.quit();
  }
});
