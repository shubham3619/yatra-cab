import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import path from 'path';
import { fileURLToPath } from 'url';

const dir = path.dirname(fileURLToPath(import.meta.url));

export default defineConfig({
  plugins: [react()],
  // Read VITE_* vars from the repo-root .env shared by all apps.
  envDir: path.resolve(dir, '../..'),
  resolve: {
    dedupe: ['react', 'react-dom'],
    alias: { '@yatracab/ui': path.resolve(dir, '../design-system/src') },
  },
  server: { port: 5173, strictPort: true },
});
