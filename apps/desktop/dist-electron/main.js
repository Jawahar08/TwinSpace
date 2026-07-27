import { app as c, ipcMain as d, safeStorage as n, BrowserWindow as S } from "electron";
import f from "path";
import i from "fs";
let u = null;
function y() {
  const a = c.getPath("userData");
  return f.join(a, "syncnotes_vault.bin");
}
function p() {
  u = new S({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#1E1E1E",
    webPreferences: {
      preload: f.join(__dirname, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !0
    }
  }), process.env.VITE_DEV_SERVER_URL ? u.loadURL(process.env.VITE_DEV_SERVER_URL) : u.loadFile(f.join(__dirname, "../dist/index.html"));
}
c.whenReady().then(() => {
  d.handle("secure-store-set", async (a, s, e) => {
    try {
      if (!n.isEncryptionAvailable())
        return !1;
      const t = y();
      let r = {};
      if (i.existsSync(t))
        try {
          const l = i.readFileSync(t), h = n.decryptString(l);
          r = JSON.parse(h);
        } catch {
          r = {};
        }
      r[s] = e;
      const o = n.encryptString(JSON.stringify(r));
      return i.writeFileSync(t, o), !0;
    } catch (t) {
      return console.error("secure-store-set error", t), !1;
    }
  }), d.handle("secure-store-get", async (a, s) => {
    try {
      if (!n.isEncryptionAvailable()) return null;
      const e = y();
      if (!i.existsSync(e)) return null;
      const t = i.readFileSync(e), r = n.decryptString(t);
      return JSON.parse(r)[s] || null;
    } catch (e) {
      return console.error("secure-store-get error", e), null;
    }
  }), d.handle("secure-store-delete", async (a, s) => {
    try {
      const e = y();
      if (i.existsSync(e) && n.isEncryptionAvailable()) {
        const t = i.readFileSync(e), r = n.decryptString(t), o = JSON.parse(r);
        delete o[s];
        const l = n.encryptString(JSON.stringify(o));
        i.writeFileSync(e, l);
      }
      return !0;
    } catch {
      return !1;
    }
  }), p(), c.on("activate", () => {
    S.getAllWindows().length === 0 && p();
  });
});
c.on("window-all-closed", () => {
  process.platform !== "darwin" && c.quit();
});
