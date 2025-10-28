import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react({
    jsxRuntime: 'automatic'
  })],
  base: '/docker_pipeline_website/',
  build: {
    outDir: 'dist',
    assetsDir: 'assets'
  }
})
