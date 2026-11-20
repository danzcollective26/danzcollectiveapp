import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

export default defineConfig({
  plugins: [react()],
  // Visible only in preview account view; resolves to the immutable Git commit built by Vercel.
  define: { __DANZ_PREVIEW_BUILD__: JSON.stringify((process.env.VERCEL_GIT_COMMIT_SHA || process.env.GITHUB_SHA || 'local').slice(0, 8)) },
  server: { allowedHosts: ['terminal.local'] },
})
