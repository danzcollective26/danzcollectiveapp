import { danzBuild, previewLabel } from './build'
import './PreviewBadge.css'

/** Small, non-interactive label so a preview is never confused with the installed app. */
export default function PreviewBadge() {
  const label = previewLabel(danzBuild, window.location.hostname)
  if (!label) return null
  return <div className="danz-preview-badge" role="note" aria-label={`Versión de prueba ${label}`}>{label}</div>
}
