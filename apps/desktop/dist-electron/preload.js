import { contextBridge as o, ipcRenderer as r } from "electron";
o.exposeInMainWorld("electronAPI", {
  secureStoreSet: (e, t) => r.invoke("secure-store-set", e, t),
  secureStoreGet: (e) => r.invoke("secure-store-get", e),
  secureStoreDelete: (e) => r.invoke("secure-store-delete", e)
});
