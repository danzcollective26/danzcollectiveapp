/** The production PWA keeps its offline cache; Vercel preview hosts do not.
 * Web origins are isolated, but preview worker caching makes QA misleading.
 * This intentionally preserves offline support on a future custom production host.
 */
export function isPreviewHostname(hostname: string): boolean {
  return hostname.endsWith('.vercel.app') && hostname !== 'danzcollectiveapp.vercel.app'
}

export function shouldRegisterOffline(productionBuild: boolean, hostname: string): boolean {
  return productionBuild && !isPreviewHostname(hostname)
}
