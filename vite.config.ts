import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import path from 'path'
import { boneyardPlugin } from 'boneyard-js/vite'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss(), 
    boneyardPlugin({
      routes: [
        "/chats",
        "/chats/fixture-1",
        "/chats/fixture-1/info",
        "/search",
        "/add"
      ]
    })
  ],
  resolve: {
    alias: {
      '@': path.resolve(__dirname, './src'),
    },
  },
  build: {
    rolldownOptions: {
      output: {
        // Split heavy stable vendor libs into their own chunks with content hashes.
        // Android WebView caches each chunk file independently — so if only your
        // app code changes, users only re-download the app chunk, not all of React/Supabase.
        manualChunks: (id) => {
          if (id.includes('@supabase')) return 'vendor-supabase';
          if (id.includes('motion') || id.includes('framer')) return 'vendor-motion';
          if (id.includes('@tanstack')) return 'vendor-query';
          if (id.includes('lucide-react')) return 'vendor-icons';
          if (id.includes('node_modules')) return 'vendor';
        }
      }
    }
  }
})

