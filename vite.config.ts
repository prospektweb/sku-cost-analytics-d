import tailwindcss from "@tailwindcss/vite";
import react from "@vitejs/plugin-react-swc";
import { defineConfig } from "vite";
import { resolve } from 'path'
import { createIconImportProxy } from './src/lib/vite-phosphor-icon-proxy-plugin'

const projectRoot = process.env.PROJECT_ROOT || import.meta.dirname

export default defineConfig(() => {
  return {
    plugins: [
      react(),
      tailwindcss(),
      createIconImportProxy(),
    ],
    resolve: {
      alias: {
        '@': resolve(projectRoot, 'src'),
        '@github/spark': resolve(projectRoot, 'src/lib/spark-stub.ts'),
      }
    },
    build: {
      rollupOptions: {
        input: resolve(projectRoot, 'dashboard.html'),
        output: {
          entryFileNames: 'assets/db-index.js',
          chunkFileNames: 'assets/db-[name].js',
          assetFileNames: 'assets/db-[name].[ext]',
          manualChunks: undefined,
        },
        external: [],
      },
      cssCodeSplit: false,
      modulePreload: false,
    },
    optimizeDeps: {
      exclude: ['@github/spark']
    }
  }
});
