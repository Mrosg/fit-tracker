import { defineConfig } from 'vite'
import { svelte } from '@sveltejs/vite-plugin-svelte'

// https://vite.dev/config/
export default defineConfig({
  base: '/fit-tracker/',
  plugins: [svelte()],
  server: {
    // Redirect 404s to index.html for client-side routing
    historyApiFallback: true
  }
})
