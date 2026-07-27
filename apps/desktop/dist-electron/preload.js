import { contextBridge, ipcRenderer } from "electron";
contextBridge.exposeInMainWorld("electronAPI", {
  secureStoreSet: (key, value) => ipcRenderer.invoke("secure-store-set", key, value),
  secureStoreGet: (key) => ipcRenderer.invoke("secure-store-get", key),
  secureStoreDelete: (key) => ipcRenderer.invoke("secure-store-delete", key)
});
