/**
 * Almacenamiento LOCAL de la demo. No es un servidor ni una copia de seguridad.
 * Guarda metadatos y fotografías como Blobs en IndexedDB.
 */
export type StoredAlbum = {
  id: string
  name: string
  date: string
  order: number
}

export type StoredPhoto = {
  id: string
  eventId: string
  name: string
  image: Blob
  addedAt: number
}

const DATABASE_NAME = 'danz-collective-local-gallery'
const DATABASE_VERSION = 1
const ALBUMS = 'albums'
const PHOTOS = 'photos'

export function openGalleryDB(): Promise<IDBDatabase> {
  if (!('indexedDB' in window)) return Promise.reject(new Error('IndexedDB no está disponible'))

  return new Promise((resolve, reject) => {
    const request = window.indexedDB.open(DATABASE_NAME, DATABASE_VERSION)
    request.onupgradeneeded = () => {
      const db = request.result
      if (!db.objectStoreNames.contains(ALBUMS)) db.createObjectStore(ALBUMS, { keyPath: 'id' })
      if (!db.objectStoreNames.contains(PHOTOS)) {
        const photos = db.createObjectStore(PHOTOS, { keyPath: 'id' })
        photos.createIndex('eventId', 'eventId', { unique: false })
      }
    }
    request.onsuccess = () => resolve(request.result)
    request.onerror = () => reject(request.error ?? new Error('No se pudo abrir el almacenamiento'))
    request.onblocked = () => reject(new Error('Cierra las otras pestañas de DANZ e inténtalo de nuevo'))
  })
}

export function loadGallery(db: IDBDatabase): Promise<{ albums: StoredAlbum[]; photos: StoredPhoto[] }> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([ALBUMS, PHOTOS], 'readonly')
    const albumsRequest = transaction.objectStore(ALBUMS).getAll()
    const photosRequest = transaction.objectStore(PHOTOS).getAll()
    transaction.oncomplete = () => {
      const albums = (albumsRequest.result as StoredAlbum[]).sort((a, b) => a.order - b.order)
      const photos = (photosRequest.result as StoredPhoto[]).sort((a, b) => a.addedAt - b.addedAt)
      resolve({ albums, photos })
    }
    transaction.onerror = () => reject(transaction.error ?? new Error('Error al leer los álbumes'))
    transaction.onabort = () => reject(transaction.error ?? new Error('Lectura cancelada'))
  })
}

function write(db: IDBDatabase, stores: string[], action: (tx: IDBTransaction) => void): Promise<void> {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(stores, 'readwrite')
    transaction.oncomplete = () => resolve()
    transaction.onerror = () => reject(transaction.error ?? new Error('No se pudo guardar'))
    transaction.onabort = () => reject(transaction.error ?? new Error('El navegador canceló el guardado'))
    try {
      action(transaction)
    } catch (error) {
      transaction.abort()
      reject(error)
    }
  })
}

export function saveAlbum(db: IDBDatabase, album: StoredAlbum) {
  return write(db, [ALBUMS], (tx) => tx.objectStore(ALBUMS).put(album))
}

export function savePhotos(db: IDBDatabase, photos: StoredPhoto[]) {
  return write(db, [PHOTOS], (tx) => {
    const store = tx.objectStore(PHOTOS)
    photos.forEach((photo) => store.put(photo))
  })
}

export function deletePhotos(db: IDBDatabase, photoIds: string[]) {
  return write(db, [PHOTOS], (tx) => {
    const store = tx.objectStore(PHOTOS)
    photoIds.forEach((id) => store.delete(id))
  })
}

export function deleteAlbum(db: IDBDatabase, albumId: string, photoIds: string[]) {
  return write(db, [ALBUMS, PHOTOS], (tx) => {
    tx.objectStore(ALBUMS).delete(albumId)
    const photosStore = tx.objectStore(PHOTOS)
    photoIds.forEach((id) => photosStore.delete(id))
  })
}
