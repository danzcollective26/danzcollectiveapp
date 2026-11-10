export type MusicLink = { label: string; href: string }
export type Artist = { id: string; name: string; links: MusicLink[]; youtubeChannelName?: string }
export type SnakeFace = { id: string; name: string; image: string }
export type Collective = { websiteUrl: string | null; artists: Artist[]; snake: { headImage: string | null; faces: SnakeFace[] } }

function record(value: unknown): Record<string, unknown> {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error('Expected a content object')
  return value as Record<string, unknown>
}
function text(value: unknown): string {
  if (typeof value !== 'string' || !value.trim() || value.trim().length > 80) throw new Error('Content needs a name of 1–80 characters')
  return value.trim()
}
function identifier(value: unknown): string {
  if (typeof value !== 'string' || !/^[a-z][a-z0-9-]{0,63}$/.test(value)) throw new Error('Invalid content identifier')
  return value
}
function httpsUrl(value: unknown): URL {
  if (typeof value !== 'string') throw new Error('Expected an HTTPS URL')
  const url = new URL(value.trim())
  if (url.protocol !== 'https:' || url.username || url.password || url.port) throw new Error('Only ordinary HTTPS links are allowed')
  return url
}
export function musicLink(value: unknown): MusicLink {
  const url = httpsUrl(value)
  url.search = ''; url.hash = ''
  const path = url.pathname.replace(/\/$/, '')
  if (url.hostname === 'open.spotify.com' && /^\/(?:intl-[a-z]{2}\/)?artist\/[A-Za-z0-9]{22}$/.test(path)) {
    url.pathname = path.replace(/^\/intl-[a-z]{2}/, '')
    return { label: 'Spotify', href: url.href }
  }
  if (['soundcloud.com', 'www.soundcloud.com'].includes(url.hostname) && /^\/[A-Za-z0-9_-]+$/.test(path)) {
    url.hostname = 'soundcloud.com'; url.pathname = path
    return { label: 'SoundCloud', href: url.href }
  }
  if (['youtube.com', 'www.youtube.com'].includes(url.hostname) && /^\/(?:@[A-Za-z0-9._-]+|channel\/[A-Za-z0-9_-]+)$/.test(path)) {
    url.hostname = 'www.youtube.com'; url.pathname = path
    return { label: 'YouTube', href: url.href }
  }
  if (['instagram.com', 'www.instagram.com'].includes(url.hostname) && /^\/[A-Za-z0-9._]+$/.test(path)) {
    url.hostname = 'www.instagram.com'; url.pathname = `${path}/`
    return { label: 'Instagram', href: url.href }
  }
  if (['mavelpoint.com', 'www.mavelpoint.com'].includes(url.hostname) && /^\/artist\/[a-z0-9-]+\/overview$/.test(path)) {
    url.hostname = 'www.mavelpoint.com'; url.pathname = path
    return { label: 'MavelPoint', href: url.href }
  }
  throw new Error('Use a direct official artist profile on a supported platform')
}
function image(value: unknown, folder: 'faces' | 'brand'): string {
  if (typeof value !== 'string' || !new RegExp(`^/arcade/${folder}/[a-z0-9][a-z0-9-]*\\.(?:png|jpe?g|webp)$`).test(value)) throw new Error('Use an approved bundled arcade image')
  return value
}
function uniqueIds<T extends { id: string }>(values: T[]): T[] {
  if (new Set(values.map(value => value.id)).size !== values.length) throw new Error('Duplicate content identifiers')
  return values
}
export function parseCollective(input: unknown): Collective {
  const source = record(input)
  const snake = record(source.snake)
  if (!Array.isArray(source.artists) || !Array.isArray(snake.faces)) throw new Error('Artists and faces must be lists')
  return {
    websiteUrl: source.websiteUrl === null ? null : httpsUrl(source.websiteUrl).href,
    artists: uniqueIds(source.artists.map(value => {
      const artist = record(value)
      if (!Array.isArray(artist.links) || !artist.links.length) throw new Error('An artist needs at least one official profile')
      const platforms = ['SoundCloud', 'Spotify', 'Instagram', 'YouTube', 'MavelPoint']
      const links = [...new Map(artist.links.map(musicLink).map(link => [link.href, link])).values()].sort((a, b) => platforms.indexOf(a.label) - platforms.indexOf(b.label))
      return { id: identifier(artist.id), name: text(artist.name), links, ...(artist.youtubeChannelName === undefined ? {} : { youtubeChannelName: text(artist.youtubeChannelName) }) }
    })),
    snake: {
      headImage: snake.headImage === null ? null : image(snake.headImage, 'brand'),
      faces: uniqueIds(snake.faces.map(value => {
        const face = record(value)
        return { id: identifier(face.id), name: text(face.name), image: image(face.image, 'faces') }
      })),
    },
  }
}
export function arcadeAssets(collective: Collective): string[] {
  return [...new Set([collective.snake.headImage, ...collective.snake.faces.map(face => face.image)].filter((path): path is string => path !== null))]
}

/** Each eaten item adds one segment. The initial body remains plain. */
export function snakeFace(faces: SnakeFace[], score: number, segment = 0): SnakeFace | null {
  const eaten = Math.floor(score / 10)
  if (!faces.length || segment < 0 || segment > eaten) return null
  return faces[(eaten - segment) % faces.length]
}
