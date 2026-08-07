import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import electron from 'vite-plugin-electron';
import path from 'path';

const isVercel = process.env.VERCEL === '1' || process.env.NETLIFY === 'true';

export default defineConfig({
  plugins: [
    react(),
    ...(!isVercel
      ? [
          electron([
            {
              entry: 'electron/main.ts',
              vite: {
                build: {
                  outDir: 'dist-electron',
                },
              },
            },
            {
              entry: 'electron/preload.ts',
              onstart(options) {
                options.reload();
              },
              vite: {
                build: {
                  outDir: 'dist-electron',
                },
              },
            },
          ]),
        ]
      : []),
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
      '@syncnotes/types': path.resolve(__dirname, '../../shared/types/src/index.ts'),
      '@syncnotes/utils': path.resolve(__dirname, '../../shared/utils/src/index.ts'),
    },
  },
  server: {
    host: true,
    port: 5173,
  },
});
