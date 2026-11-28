import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/** Browser suites set DANZ_E2E=1 so the cabinet opens at once. A spec opts back in with sessionStorage danz-arcade-intro-force=1. Production builds leave this out. */
function playwrightIntroBypass(): Plugin {
  const enabled = process.env.DANZ_E2E === '1'
  return {
    name: 'danz-playwright-intro-bypass',
    transformIndexHtml(html) {
      if (!enabled) return html
      const script = `<script>try{if(sessionStorage.getItem('danz-arcade-intro-force')!=='1')['groove','snake','collecta','danzporter'].forEach(function(id){sessionStorage.setItem('danz-arcade-intro-seen:'+id,'1')})}catch(e){}</script>`
      return html.replace('<head>', `<head>${script}`)
    },
  }
}

export default defineConfig({
  plugins: [react(), playwrightIntroBypass()],
  server: { allowedHosts: ['terminal.local'] },
})
