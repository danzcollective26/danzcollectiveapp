import { isDanzPreviewHost } from '../auth/oauth.ts'

export type DanzBuild = { env: string; sha: string; ref: string }
declare const __DANZ_BUILD__: DanzBuild | undefined

export const danzBuild: DanzBuild = typeof __DANZ_BUILD__ === 'object' && __DANZ_BUILD__ ? __DANZ_BUILD__ : { env: 'local', sha: '', ref: '' }

/** Text for the preview label, or null on production and local builds. */
export function previewLabel(build: DanzBuild, hostname: string): string | null {
  if (build.env !== 'preview' && !isDanzPreviewHost(hostname)) return null
  const parts = ['PRUEBA', build.sha, build.ref].filter(Boolean)
  return parts.join(' · ')
}
