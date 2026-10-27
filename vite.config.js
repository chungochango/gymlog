import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'

export default defineConfig({
  // Relative paths so the build works from any folder (e.g. GitHub Pages /gymlog/).
  base: './',
  plugins: [react(), tailwindcss()],
})
