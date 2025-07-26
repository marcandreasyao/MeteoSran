import path from 'path';
import { defineConfig, loadEnv } from 'vite';

export default defineConfig(({ mode }) => {
    const env = loadEnv(mode, '.', '');
    return {
      define: {
        'process.env.API_KEY': JSON.stringify(env.GEMINI_API_KEY),
        'process.env.GEMINI_API_KEY': JSON.stringify(env.GEMINI_API_KEY)
      },
      resolve: {
        alias: {
          '@': path.resolve(__dirname, '.'),
        }
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
      server: {
        host: true, // Allow external connections for testing PWA
        port: 5173,
        cors: true
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
