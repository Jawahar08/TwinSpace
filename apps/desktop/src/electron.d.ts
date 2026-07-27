export {};

declare global {
  interface Window {
    electronAPI?: {
      secureStoreSet: (key: string, value: string) => Promise<boolean>;
      secureStoreGet: (key: string) => Promise<string | null>;
      secureStoreDelete: (key: string) => Promise<boolean>;
    };
  }
}
