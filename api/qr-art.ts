import { makeQrArtHandler } from '../server/qrArt.ts'

export const maxDuration = 150
export default { fetch: makeQrArtHandler() }
