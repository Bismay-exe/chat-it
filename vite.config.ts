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
})
