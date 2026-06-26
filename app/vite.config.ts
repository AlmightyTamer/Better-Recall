import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';

const deployTarget = process.env.VITE_DEPLOY_TARGET ?? 'pages';
const repoBase = process.env.VITE_REPO_BASE ?? '/recall/';
const base = deployTarget === 'capacitor' ? './' : repoBase;

export default defineConfig({
  plugins: [react()],
  base,
  build: {
    outDir: 'dist',
    sourcemap: false,
    chunkSizeWarningLimit: 600,
    rollupOptions: {
      output: {
        manualChunks: {
          three: ['three'],
          recharts: ['recharts'],
          dexie: ['dexie', 'dexie-react-hooks'],
        },
      },
    },
  },
  server: {
    port: 3000,
    host: true,
  },
});
