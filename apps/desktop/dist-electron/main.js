import { app as c, ipcMain as u, safeStorage as n, BrowserWindow as h } from "electron";
import l from "path";
import o from "fs";
import { fileURLToPath as m } from "url";
const w = m(import.meta.url), p = l.dirname(w);
let f = null;
function y() {
  const a = c.getPath("userData");
  return l.join(a, "syncnotes_vault.bin");
}
function S() {
  f = new h({
    width: 1100,
    height: 720,
    minWidth: 800,
    minHeight: 500,
    titleBarStyle: "hiddenInset",
    backgroundColor: "#1E1E1E",
    webPreferences: {
      preload: l.join(p, "preload.js"),
      nodeIntegration: !1,
      contextIsolation: !0,
      sandbox: !0
    }
  }), process.env.VITE_DEV_SERVER_URL ? f.loadURL(process.env.VITE_DEV_SERVER_URL) : f.loadFile(l.join(p, "../dist/index.html"));
}
c.whenReady().then(() => {
  u.handle("secure-store-set", async (a, i, e) => {
    try {
      if (!n.isEncryptionAvailable())
        return !1;
      const t = y();
      let r = {};
      if (o.existsSync(t))
        try {
          const d = o.readFileSync(t), g = n.decryptString(d);
          r = JSON.parse(g);
        } catch {
          r = {};
        }
      r[i] = e;
      const s = n.encryptString(JSON.stringify(r));
      return o.writeFileSync(t, s), !0;
    } catch (t) {
      return console.error("secure-store-set error", t), !1;
    }
  }), u.handle("secure-store-get", async (a, i) => {
    try {
      if (!n.isEncryptionAvailable()) return null;
      const e = y();
      if (!o.existsSync(e)) return null;
      const t = o.readFileSync(e), r = n.decryptString(t);
      return JSON.parse(r)[i] || null;
    } catch (e) {
      return console.error("secure-store-get error", e), null;
    }
  }), u.handle("secure-store-delete", async (a, i) => {
    try {
      const e = y();
      if (o.existsSync(e) && n.isEncryptionAvailable()) {
        const t = o.readFileSync(e), r = n.decryptString(t), s = JSON.parse(r);
        delete s[i];
        const d = n.encryptString(JSON.stringify(s));
        o.writeFileSync(e, d);
      }
      return !0;
    } catch {
      return !1;
    }
  }), S(), c.on("activate", () => {
    h.getAllWindows().length === 0 && S();
  });
});
c.on("window-all-closed", () => {
  process.platform !== "darwin" && c.quit();
});
