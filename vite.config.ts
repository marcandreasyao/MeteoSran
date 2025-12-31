import path from 'path';
import { defineConfig, loadEnv } from 'vite';
import react from '@vitejs/plugin-react';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      plugins: [react()],
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
      },
      server: {
        proxy: {
          '/api': {
            target: 'http://localhost:5001',
            changeOrigin: true,
            secure: false,
          },
        },
        host: true, // Allow external connections for testing PWA
        port: 5173,
        cors: true
      },
      build: {
        rollupOptions: {
          output: {
            manualChunks: {
              vendor: ['react', 'react-dom'],
              ai: ['@google/genai'],
              markdown: ['react-markdown', 'remark-gfm']
            }
          }
        },
        // Enable source maps for debugging
        sourcemap: mode === 'development',
        // Optimize for PWA
        target: 'es2020',
        minify: 'terser',
        terserOptions: {
          compress: {
            drop_console: mode === 'production',
            drop_debugger: mode === 'production'
          }
        }
      },
      preview: {
        host: true,
        port: 4173,
        cors: true
      },
      // PWA-specific optimizations
      optimizeDeps: {
        include: ['react', 'react-dom', '@google/genai', 'react-markdown']
      }
    };
});
