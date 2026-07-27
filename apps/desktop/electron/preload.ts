import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  secureStoreSet: (key: string, value: string) => ipcRenderer.invoke('secure-store-set', key, value),
  secureStoreGet: (key: string) => ipcRenderer.invoke('secure-store-get', key),
  secureStoreDelete: (key: string) => ipcRenderer.invoke('secure-store-delete', key),
});
