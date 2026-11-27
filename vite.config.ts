import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'

// Vercel exposes these system variables at build time. They identify the build
// on preview deployments only (issue #67); nothing secret is embedded.
const build = {
  env: process.env.VERCEL_ENV ?? 'local',
  sha: (process.env.VERCEL_GIT_COMMIT_SHA ?? '').slice(0, 7),
  ref: process.env.VERCEL_GIT_COMMIT_REF ?? '',
}

export default defineConfig({
  plugins: [react()],
  define: { __DANZ_BUILD__: JSON.stringify(build) },
  server: { allowedHosts: ['terminal.local'] },
})
