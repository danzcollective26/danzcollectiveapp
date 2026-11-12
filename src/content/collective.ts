export type MusicLink = { label: string; href: string }
export type Artist = { id: string; name: string; links: MusicLink[]; youtubeChannelName?: string; image?: string }
export type Member = Artist & { roles: string[]; bio?: string }
export type SnakeFace = { id: string; name: string; image: string }
export type Collective = { websiteUrl: string | null; members: Member[]; artists: Member[]; snake: { headImage: string | null; faces: SnakeFace[] } }

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
  const legacy = source.members === undefined
  if (!legacy && source.artists !== undefined) throw new Error('Use one member registry, not two profile lists')
  const people = legacy ? source.artists : source.members
  if (!Array.isArray(people) || !Array.isArray(snake.faces)) throw new Error('Members and faces must be lists')
  const members = uniqueIds(people.map(value => {
    const artist = record(value)
    const rawRoles = legacy ? ['DJ'] : artist.roles
    if (!Array.isArray(rawRoles) || !rawRoles.length || rawRoles.length > 8) throw new Error('A member needs 1–8 roles')
    const roles = [...new Set(rawRoles.map(text))]
    if (!Array.isArray(artist.links) || (roles.includes('DJ') && !artist.links.length)) throw new Error('A DJ needs at least one official profile')
    const platforms = ['SoundCloud', 'Spotify', 'Instagram', 'YouTube', 'MavelPoint']
    const links = [...new Map(artist.links.map(musicLink).map(link => [link.href, link])).values()].sort((a, b) => platforms.indexOf(a.label) - platforms.indexOf(b.label))
    if (artist.image !== undefined && (typeof artist.image !== 'string' || !/^\/(?:artists|team)\/[a-z0-9][a-z0-9-]*\.(?:png|jpe?g|webp)$/.test(artist.image))) throw new Error('Use a bundled public member portrait')
    if (artist.bio !== undefined && (typeof artist.bio !== 'string' || !artist.bio.trim() || artist.bio.trim().length > 600)) throw new Error('Invalid member biography')
    return { id: identifier(artist.id), name: text(artist.name), roles, links, ...(artist.bio === undefined ? {} : { bio: (artist.bio as string).trim() }), ...(artist.youtubeChannelName === undefined ? {} : { youtubeChannelName: text(artist.youtubeChannelName) }), ...(artist.image === undefined ? {} : { image: artist.image as string }) }
  }))
  return {
    websiteUrl: source.websiteUrl === null ? null : httpsUrl(source.websiteUrl).href,
    members,
    artists: members.filter(member => member.roles.includes('DJ')),
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
export function collectiveAssets(collective: Collective): string[] {
  return [...new Set([...arcadeAssets(collective), ...collective.members.flatMap(member => member.image ? [member.image] : [])])]
}

/** Each eaten item adds one segment. The initial body remains plain. */
export function snakeFace(faces: SnakeFace[], score: number, segment = 0): SnakeFace | null {
  const eaten = Math.floor(score / 10)
  if (!faces.length || segment < 0 || segment > eaten) return null
  return faces[(eaten - segment) % faces.length]
}
