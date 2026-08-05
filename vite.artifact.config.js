import { defineConfig } from 'vite';
import react from '@vitejs/plugin-react';
import { viteSingleFile } from 'vite-plugin-singlefile';

// Produces a single self-contained HTML file (all JS/CSS inlined, no external
// requests) for previewing Kaira as a claude.ai Artifact. No PWA/service worker.
export default defineConfig({
  plugins: [react(), viteSingleFile()],
  build: {
    outDir: 'dist-artifact',
    cssCodeSplit: false,
    assetsInlineLimit: 100000000,
    chunkSizeWarningLimit: 100000,
    rollupOptions: {
      input: 'index.artifact.html',
      output: { inlineDynamicImports: true },
    },
  },
});
