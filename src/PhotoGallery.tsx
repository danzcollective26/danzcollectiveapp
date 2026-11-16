import { useEffect, useRef, useState, type ChangeEvent, type FormEvent, type PointerEvent } from 'react'
import {
  deleteAlbum, deletePhotos, loadGallery, openGalleryDB, saveAlbum, savePhotos,
  type StoredAlbum, type StoredPhoto,
} from './galleryStorage'
import './PhotoGallery.css'
import { GallerySkeleton } from './feel/Skeleton'
import ProgressiveImage from './feel/ProgressiveImage'
import { favoriteKey } from './feel/favorites'
import { pulse } from './feel/haptics'
import { useFavorites } from './feel/useFavorites'
import { clampScale, decideSwipe } from './feel/viewerGestures'

type Photo = { id: string; name: string; url: string }
type EventAlbum = { id: string; name: string; date: string; photos: Photo[] }
type Props = { active: boolean; onBack: () => void }

const MAX_PHOTOS_PER_EVENT = 60
const MAX_PHOTOS_TOTAL = 180
const MAX_FILE_BYTES = 25 * 1024 * 1024 // No intentar guardar originales enormes en la demo
const ACCEPTED_TYPES = new Set(['image/jpeg', 'image/png', 'image/webp', 'image/gif', 'image/avif'])

function formatDate(date: string) {
  if (!date) return 'Fecha sin indicar'
  const parts = date.split('-')
  if (parts.length !== 3) return date
  return `${parts[2]}/${parts[1]}/${parts[0]}`
}

function makeId() {
  return typeof crypto !== 'undefined' && 'randomUUID' in crypto
    ? crypto.randomUUID()
    : `${Date.now()}-${Math.random().toString(36).slice(2)}`
}

function saveErrorMessage(error: unknown) {
  if (error instanceof DOMException && (error.name === 'QuotaExceededError' || error.name === 'NS_ERROR_DOM_QUOTA_REACHED')) {
    return 'No queda espacio disponible para guardar estas fotos en el navegador. Prueba con menos imágenes o archivos más pequeños.'
  }
  return `No se pudo guardar en este navegador. El cambio no se ha aplicado. ${error instanceof Error ? error.message : ''}`
}

export default function PhotoGallery({ active, onBack }: Props) {
  const [events, setEvents] = useState<EventAlbum[]>([])
  // Solo vista previa LOCAL. No representa permisos ni autenticación reales.
  const [previewRole, setPreviewRole] = useState<'admin' | 'visitor'>('admin')
  const isAdminPreview = previewRole === 'admin'
  const [activeEventId, setActiveEventId] = useState<string | null>(null)
  const [loading, setLoading] = useState(true)
  const [storageError, setStorageError] = useState('')
  const [busy, setBusy] = useState(false)
  const busyRef = useRef(false)
  const dbRef = useRef<IDBDatabase | null>(null)
  const [newEventName, setNewEventName] = useState('')
  const [newEventDate, setNewEventDate] = useState('')
  const [editingEvent, setEditingEvent] = useState(false)
  const [editedName, setEditedName] = useState('')
  const [editedDate, setEditedDate] = useState('')
  const [selected, setSelected] = useState<number | null>(null)
  const [onlyFavorites, setOnlyFavorites] = useState(false)
  const [viewerZoom, setViewerZoom] = useState(1)
  const [viewerPan, setViewerPan] = useState({ x: 0, y: 0 })
  const [message, setMessage] = useState('')
  const favorites = useFavorites()
  const inputRef = useRef<HTMLInputElement>(null)
  const objectUrls = useRef(new Set<string>())
  const pointers = useRef(new Map<number, { x: number; y: number }>())
  const pinchStart = useRef<{ distance: number; scale: number } | null>(null)
  const drag = useRef<{ id: number; x: number; y: number; ox: number; oy: number; moved: boolean } | null>(null)
  const lastTap = useRef<{ at: number; x: number; y: number } | null>(null)
  const lastPointerType = useRef('mouse')

  const currentEvent = events.find((album) => album.id === activeEventId) ?? events[0]
  const photos = currentEvent?.photos ?? []
  const totalPhotos = events.reduce((total, album) => total + album.photos.length, 0)
  const locked = loading || busy || Boolean(storageError)

  const switchPreview = (role: 'admin' | 'visitor') => {
    setPreviewRole(role)
    setSelected(null)
    setEditingEvent(false)
    setMessage('')
  }

  useEffect(() => {
    let cancelled = false
    let connection: IDBDatabase | null = null

    async function initialise() {
      try {
        const db = await openGalleryDB()
        connection = db
        if (cancelled) { db.close(); return }
        const stored = await loadGallery(db)
        if (cancelled) return
        dbRef.current = db
        const albums = stored.albums.map((album) => ({
          id: album.id,
          name: album.name,
          date: album.date,
          photos: stored.photos.filter((item) => item.eventId === album.id).map((item) => {
            const url = URL.createObjectURL(item.image)
            objectUrls.current.add(url)
            return { id: item.id, name: item.name, url }
          }),
        }))
        setEvents(albums)
        setActiveEventId(albums[0]?.id ?? null)
      } catch (error) {
        if (!cancelled) setStorageError(`El almacenamiento local no está disponible: ${error instanceof Error ? error.message : 'error desconocido'}. Comprueba que no estás en modo privado.`)
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    void initialise()
    return () => {
      cancelled = true
      connection?.close()
      if (dbRef.current === connection) dbRef.current = null
      objectUrls.current.forEach((url) => URL.revokeObjectURL(url))
      objectUrls.current.clear()
    }
  }, [])

  useEffect(() => {
    if (!active) setSelected(null)
  }, [active])

  useEffect(() => {
    setViewerZoom(1)
    setViewerPan({ x: 0, y: 0 })
    pointers.current.clear()
    pinchStart.current = null
    drag.current = null
    lastTap.current = null
  }, [selected])

  useEffect(() => {
    if (!active || selected === null) return
    const oldOverflow = document.body.style.overflow
    document.body.style.overflow = 'hidden'
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setSelected(null)
      if (event.key === 'ArrowLeft') {
        event.preventDefault()
        setSelected((index) => index === null || photos.length < 2 ? index : (index + photos.length - 1) % photos.length)
      }
      if (event.key === 'ArrowRight') {
        event.preventDefault()
        setSelected((index) => index === null || photos.length < 2 ? index : (index + 1) % photos.length)
      }
    }
    document.addEventListener('keydown', onKeyDown)
    return () => {
      document.body.style.overflow = oldOverflow
      document.removeEventListener('keydown', onKeyDown)
    }
  }, [active, selected, photos.length])

  // Sólo mostramos un cambio como realizado cuando IndexedDB confirma la transacción.
  const commit = async (task: (db: IDBDatabase) => Promise<void>, onSaved: () => void) => {
    const db = dbRef.current
    if (!db || busyRef.current || loading || storageError) return
    busyRef.current = true
    setBusy(true)
    try {
      await task(db)
      onSaved()
    } catch (error) {
      setMessage(saveErrorMessage(error))
    } finally {
      busyRef.current = false
      setBusy(false)
    }
  }

  const createEvent = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    const name = newEventName.trim()
    if (!name || locked || !isAdminPreview) return
    const album: StoredAlbum = { id: makeId(), name, date: newEventDate, order: Date.now() }
    void commit((db) => saveAlbum(db, album), () => {
      setEvents((previous) => [...previous, { id: album.id, name, date: album.date, photos: [] }])
      setActiveEventId(album.id)
      setSelected(null)
      setEditingEvent(false)
      setNewEventName('')
      setNewEventDate('')
      setMessage(`Álbum «${name}» creado y guardado en este navegador.`)
    })
  }

  const changeEvent = (id: string) => {
    if (locked) return
    setSelected(null)
    setActiveEventId(id)
    setEditingEvent(false)
    setMessage('')
  }

  const addPhotos = (event: ChangeEvent<HTMLInputElement>) => {
    const files = Array.from(event.currentTarget.files ?? [])
    event.currentTarget.value = ''
    if (!files.length || !currentEvent || locked || !isAdminPreview) return
    const valid = files.filter((file) => ACCEPTED_TYPES.has(file.type) && file.size <= MAX_FILE_BYTES)
    const available = Math.min(MAX_PHOTOS_PER_EVENT - photos.length, MAX_PHOTOS_TOTAL - totalPhotos)
    const chosen = valid.slice(0, Math.max(0, available))
    const eventId = currentEvent.id
    const rows: StoredPhoto[] = chosen.map((file, index) => ({
      id: makeId(), eventId, name: file.name, image: file, addedAt: Date.now() + index,
    }))
    if (!rows.length) {
      setMessage('No se han añadido fotos. Comprueba el formato, el límite de 25 MB por archivo y el máximo del álbum.')
      return
    }
    void commit((db) => savePhotos(db, rows), () => {
      const added = rows.map((item) => {
        const url = URL.createObjectURL(item.image)
        objectUrls.current.add(url)
        return { id: item.id, name: item.name, url }
      })
      setEvents((previous) => previous.map((album) => album.id === eventId
        ? { ...album, photos: [...album.photos, ...added] }
        : album))
      const skipped = files.length - rows.length
      setMessage(`${rows.length} fotografía${rows.length === 1 ? '' : 's'} guardada${rows.length === 1 ? '' : 's'} en este navegador.${skipped ? ` ${skipped} omitida${skipped === 1 ? '' : 's'} (formato, tamaño o límite).` : ''}`)
    })
  }

  const startEditingEvent = () => {
    if (!currentEvent || locked || !isAdminPreview) return
    setEditedName(currentEvent.name)
    setEditedDate(currentEvent.date)
    setEditingEvent(true)
    setMessage('')
  }

  const saveEventChanges = (event: FormEvent<HTMLFormElement>) => {
    event.preventDefault()
    if (!currentEvent || locked || !isAdminPreview) return
    const name = editedName.trim()
    if (!name) { setMessage('El nombre del evento no puede quedar vacío.'); return }
    const albumId = currentEvent.id
    const album: StoredAlbum = {
      id: albumId, name, date: editedDate,
      order: events.findIndex((entry) => entry.id === albumId) + 1,
    }
    // El orden visual se conserva por la posición actual; tras recargar se usa el orden estable original.
    void commit(async (db) => {
      const stored = await loadGallery(db)
      const original = stored.albums.find((entry) => entry.id === albumId)
      await saveAlbum(db, { ...album, order: original?.order ?? album.order })
    }, () => {
      setEvents((previous) => previous.map((entry) => entry.id === albumId ? { ...entry, name, date: editedDate } : entry))
      setEditingEvent(false)
      setMessage(`Datos de «${name}» guardados.`)
    })
  }

  const releaseUrls = (removed: Photo[]) => {
    removed.forEach((item) => {
      URL.revokeObjectURL(item.url)
      objectUrls.current.delete(item.url)
    })
  }

  const removePhoto = (photoId: string) => {
    if (!currentEvent || locked || !isAdminPreview) return
    const target = photos.find((item) => item.id === photoId)
    if (!target || !window.confirm(`¿Quitar «${target.name}» de este álbum? El archivo original de tu ordenador no se borrará.`)) return
    const eventId = currentEvent.id
    void commit((db) => deletePhotos(db, [photoId]), () => {
      setSelected(null)
      setEvents((previous) => previous.map((album) => album.id === eventId
        ? { ...album, photos: album.photos.filter((item) => item.id !== photoId) }
        : album))
      releaseUrls([target])
      setMessage(`«${target.name}» retirada del álbum guardado. Original intacto.`)
    })
  }

  const clearCurrentEvent = () => {
    if (!currentEvent || locked || !isAdminPreview || !photos.length || !window.confirm(`¿Vaciar las fotos de «${currentEvent.name}»? Los originales de tu ordenador no se borrarán.`)) return
    const eventId = currentEvent.id
    const removed = [...photos]
    void commit((db) => deletePhotos(db, removed.map((item) => item.id)), () => {
      setSelected(null)
      setEvents((previous) => previous.map((album) => album.id === eventId ? { ...album, photos: [] } : album))
      releaseUrls(removed)
      setMessage(`Álbum «${currentEvent.name}» vaciado y cambio guardado.`)
    })
  }

  const removeCurrentEvent = () => {
    if (!currentEvent || locked || !isAdminPreview || !window.confirm(`¿Eliminar el álbum «${currentEvent.name}» y sus ${photos.length} fotos de prueba? Los originales del ordenador NO se borrarán.`)) return
    const eventId = currentEvent.id
    const removed = [...photos]
    void commit((db) => deleteAlbum(db, eventId, removed.map((item) => item.id)), () => {
      const remaining = events.filter((album) => album.id !== eventId)
      setEvents(remaining)
      setActiveEventId(remaining[0]?.id ?? null)
      setSelected(null)
      setEditingEvent(false)
      releaseUrls(removed)
      setMessage('Álbum eliminado del almacenamiento local. Los originales siguen intactos.')
    })
  }

  const previous = () => setSelected((index) => index === null || photos.length < 2 ? index : (index + photos.length - 1) % photos.length)
  const next = () => setSelected((index) => index === null || photos.length < 2 ? index : (index + 1) % photos.length)
  const toggleViewerZoom = () => {
    setViewerZoom(value => value > 1 ? 1 : 2)
    setViewerPan({ x: 0, y: 0 })
    lastTap.current = null
  }

  const onViewerDown = (event: PointerEvent<HTMLDivElement>) => {
    lastPointerType.current = event.pointerType
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size > 1) {
      drag.current = null
      lastTap.current = null
      if (pointers.current.size === 2) {
        const [a, b] = [...pointers.current.values()]
        pinchStart.current = { distance: Math.max(1, Math.hypot(a.x - b.x, a.y - b.y)), scale: viewerZoom }
      }
      return
    }
    if (!event.isPrimary || event.button !== 0) return
    drag.current = { id: event.pointerId, x: event.clientX, y: event.clientY, ox: viewerPan.x, oy: viewerPan.y, moved: false }
    try { event.currentTarget.setPointerCapture(event.pointerId) } catch { /* Embedded views can still swipe without capture. */ }
  }
  const onViewerMove = (event: PointerEvent<HTMLDivElement>) => {
    if (!pointers.current.has(event.pointerId)) return
    pointers.current.set(event.pointerId, { x: event.clientX, y: event.clientY })
    if (pointers.current.size >= 2 && pinchStart.current) {
      const [a, b] = [...pointers.current.values()]
      const distance = Math.max(1, Math.hypot(a.x - b.x, a.y - b.y))
      setViewerZoom(clampScale(pinchStart.current.scale * (distance / pinchStart.current.distance)))
      return
    }
    const start = drag.current
    if (!start || start.id !== event.pointerId || viewerZoom <= 1) return
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    if (Math.hypot(dx, dy) > 8) start.moved = true
    setViewerPan({ x: start.ox + dx, y: start.oy + dy })
  }
  const onViewerUp = (event: PointerEvent<HTMLDivElement>) => {
    pointers.current.delete(event.pointerId)
    if (pointers.current.size < 2) pinchStart.current = null
    const start = drag.current
    if (!start || start.id !== event.pointerId) return
    drag.current = null
    const dx = event.clientX - start.x
    const dy = event.clientY - start.y
    const moved = start.moved || Math.hypot(dx, dy) > 8
    if (event.pointerType === 'touch' && !moved) {
      const previousTap = lastTap.current
      if (previousTap && event.timeStamp - previousTap.at < 320 && Math.hypot(event.clientX - previousTap.x, event.clientY - previousTap.y) < 24) toggleViewerZoom()
      else lastTap.current = { at: event.timeStamp, x: event.clientX, y: event.clientY }
      return
    }
    lastTap.current = null
    const decision = decideSwipe(dx, dy, viewerZoom > 1, moved)
    if (decision === 'dismiss') setSelected(null)
    if (decision === 'next') next()
    if (decision === 'previous') previous()
  }
  const markFavorite = (id: string) => {
    const saved = favorites.toggle(favoriteKey('local', id))
    pulse(saved ? 'confirm' : 'tap')
  }

  const photo = selected === null ? null : photos[selected]
  return (
    <section className="content inner-page gallery-section" hidden={!active} aria-busy={busy || loading}>
      <button className="back" onClick={onBack}>← VOLVER AL INICIO</button>
      <div className="eyebrow">DANZERS / MEMORIES / EVENTOS · DEMO LOCAL</div>
      <h1 className="page-title">THE NIGHT<br /><em>STAYS.</em></h1>
      <p className="page-lead">{isAdminPreview
        ? 'Crea álbumes y añade fotos de prueba. Se guardan en este navegador y sobreviven a la recarga.'
        : 'Explora las fotografías de las fiestas desde la vista previa de asistente.'}</p>
      <div className="gallery-role-switch" aria-label="Cambiar vista de prueba">
        <div className="gallery-role-switch-text">
          <strong>SIMULADOR DE VISTAS</strong>
          <span>Prueba cómo se verá Fotos desde administración o como asistente.</span>
        </div>
        <div className="gallery-role-buttons">
          <button type="button" className={isAdminPreview ? 'gallery-role-active' : ''} aria-pressed={isAdminPreview} onClick={() => switchPreview('admin')}>ADMINISTRACIÓN</button>
          <button type="button" className={!isAdminPreview ? 'gallery-role-active' : ''} aria-pressed={!isAdminPreview} onClick={() => switchPreview('visitor')}>VISTA ASISTENTE</button>
        </div>
      </div>
      <p className="gallery-role-warning">⚠ DEMO SIN SEGURIDAD REAL: cualquiera en este navegador puede cambiar de vista. No publiques aquí datos privados. El acceso real por cuenta y sello se configurará en el servidor.</p>

      {isAdminPreview && <div className="gallery-storage-status" role="status">
        <strong>{loading ? 'CARGANDO ÁLBUMES...' : storageError ? 'ALMACENAMIENTO NO DISPONIBLE' : busy ? 'GUARDANDO CAMBIOS...' : '✓ GUARDADO LOCAL ACTIVADO'}</strong>
        <span>IndexedDB · Solo en este navegador · No es una copia de seguridad ni está publicado en internet.</span>
      </div>}
      {storageError && <p className="gallery-storage-warning" role="alert">{storageError} No se ha activado el guardado: evita cargar datos hasta resolverlo.</p>}

      <div className="gallery-section-heading">
        <div>
          <span className="gallery-step">01 / ELIGE UNA FIESTA</span>
          <h2>Álbumes por evento</h2>
        </div>
        <span className="gallery-album-count">{events.length} EVENTO{events.length === 1 ? '' : 'S'} · {totalPhotos} FOTOS</span>
      </div>

      {loading && events.length === 0 && <GallerySkeleton label="Cargando álbumes" count={3} />}
      {!loading && events.length === 0 && <p className="gallery-instructions">{isAdminPreview ? 'Todavía no tienes álbumes. Crea uno en el formulario inferior.' : 'Todavía no hay galerías para ver en esta demostración.'}</p>}
      <div className="gallery-event-grid" aria-label="Álbumes de eventos de prueba">
        {events.map((album) => (
          <button
            key={album.id}
            type="button"
            className={`gallery-event-card ${album.id === activeEventId ? 'gallery-event-active' : ''}`}
            onClick={() => changeEvent(album.id)}
            disabled={locked}
            aria-pressed={album.id === activeEventId}
          >
            {album.photos.length ? (
              <img className="gallery-event-cover" src={album.photos[0].url} alt="" />
            ) : <span className="gallery-event-placeholder" aria-hidden="true">✳</span>}
            <span className="gallery-event-information">
              <span className="gallery-event-date">{formatDate(album.date)}</span>
              <strong>{album.name}</strong>
              <span>{album.photos.length} FOTOGRAFÍA{album.photos.length === 1 ? '' : 'S'} <span aria-hidden="true">↗</span></span>
            </span>
          </button>
        ))}
      </div>

      {isAdminPreview && <form className="gallery-add-event" onSubmit={createEvent}>
        <label htmlFor="gallery-event-name">CREAR OTRO EVENTO</label>
        <div className="gallery-add-event-fields">
          <input
            id="gallery-event-name"
            type="text"
            placeholder="Nombre de la fiesta"
            value={newEventName}
            onChange={(event) => setNewEventName(event.target.value)}
            disabled={locked}
            maxLength={70}
            required
          />
          <label className="gallery-date-field" htmlFor="gallery-event-date">
            <span>FECHA (OPCIONAL)</span>
            <input
              id="gallery-event-date"
              type="date"
              value={newEventDate}
              onChange={(event) => setNewEventDate(event.target.value)}
              disabled={locked}
            />
          </label>
          <button type="submit" className="primary-btn" disabled={locked}>CREAR ÁLBUM ＋</button>
        </div>
      </form>}

      {!currentEvent && message && <p className="gallery-notice" role="status">{message}</p>}
      {currentEvent && <>
        <div className="gallery-section-heading gallery-active-heading">
          <div>
            <span className="gallery-step">02 / ÁLBUM SELECCIONADO · {formatDate(currentEvent.date)}</span>
            <h2>{currentEvent.name}</h2>
          </div>
          <span className="gallery-album-count">{photos.length} / {MAX_PHOTOS_PER_EVENT} FOTOS</span>
        </div>

        {isAdminPreview && <div className="gallery-manage-bar" aria-label="Administrar evento de prueba">
          <span>GESTIÓN DEL ÁLBUM · DEMO LOCAL</span>
          <div className="gallery-manage-actions">
            <button type="button" className="outline-btn" onClick={startEditingEvent} disabled={locked}>
              EDITAR NOMBRE Y FECHA
            </button>
            <button type="button" className="gallery-danger-btn" onClick={removeCurrentEvent} disabled={locked}>
              ELIMINAR ÁLBUM
            </button>
          </div>
        </div>}
        {isAdminPreview && editingEvent && (
          <form className="gallery-edit-event" onSubmit={saveEventChanges}>
            <label htmlFor="gallery-edit-name">NOMBRE DEL EVENTO</label>
            <input id="gallery-edit-name" type="text" value={editedName} onChange={(event) => setEditedName(event.target.value)} disabled={locked} maxLength={70} required />
            <label htmlFor="gallery-edit-date">FECHA (OPCIONAL)</label>
            <input id="gallery-edit-date" type="date" value={editedDate} onChange={(event) => setEditedDate(event.target.value)} disabled={locked} />
            <div className="gallery-edit-actions">
              <button type="submit" className="primary-btn" disabled={locked}>GUARDAR CAMBIOS</button>
              <button type="button" className="outline-btn" onClick={() => setEditingEvent(false)} disabled={locked}>CANCELAR</button>
            </div>
          </form>
        )}
        <div className="gallery-toolbar">
          <div className="gallery-toolbar-text">
            <strong>{photos.length ? `${photos.length} FOTOGRAFÍAS` : 'ÁLBUM VACÍO'}</strong>
            <span>{isAdminPreview ? `Guardado local · JPEG, PNG, WebP, GIF o AVIF · máximo 25 MB por archivo · ${MAX_PHOTOS_TOTAL} fotos en total` : 'Vista de asistente: explora los recuerdos de esta fiesta.'}</span>
          </div>
          {isAdminPreview && <div className="gallery-toolbar-actions">
            <input
              ref={inputRef}
              className="gallery-file-input"
              type="file"
              accept="image/jpeg,image/png,image/webp,image/gif,image/avif"
              multiple
              onChange={addPhotos}
              disabled={locked}
              aria-label={`Añadir fotografías a ${currentEvent.name}`}
            />
            <button type="button" className="primary-btn" onClick={() => inputRef.current?.click()} disabled={locked}>
              {photos.length ? 'AÑADIR MÁS' : 'SELECCIONAR FOTOS'} <span>＋</span>
            </button>
            {photos.length > 0 && <button type="button" className="outline-btn" onClick={clearCurrentEvent} disabled={locked}>VACIAR ÁLBUM</button>}
            {photos.length > 0 && <button type="button" className="outline-btn gallery-favorite-filter" aria-pressed={onlyFavorites} onClick={() => setOnlyFavorites(value => !value)}>{onlyFavorites ? 'VER TODAS' : 'SOLO FAVORITAS'}</button>}
          </div>}
        </div>
        {message && <p className="gallery-notice" role="status">{message}</p>}

        {photos.length === 0 ? (
          <div className="gallery-empty">
            <div className="gallery-empty-symbol" aria-hidden="true">▧</div>
            <div>
              <h2>Este evento aún no tiene fotografías</h2>
              <p>{isAdminPreview ? 'Selecciona imágenes de tu ordenador. Después cambia de álbum y añade otras para comprobar que están separadas.' : 'Aún no hay fotografías en este evento.'}</p>
            </div>
            <span className="pill">SOLO PRUEBA LOCAL</span>
          </div>
        ) : (
          <>
            <p className="gallery-instructions">Pulsa una foto para ampliarla. Desliza en horizontal para pasar de foto, hacia abajo para cerrar, y pellizca o haz doble toque para ampliar.</p>
            <div className="gallery-grid">
              {photos.map((item, index) => {
                const saved = favorites.has(favoriteKey('local', item.id))
                if (onlyFavorites && !saved) return null
                return (
                <div className="gallery-photo-container" key={item.id}>
                  <button type="button" className="gallery-photo" onClick={() => setSelected(index)} aria-label={`Abrir fotografía ${index + 1}: ${item.name}`}>
                    <ProgressiveImage src={item.url} alt={item.name} eager={index < 4} />
                    <span className="gallery-photo-counter">{String(index + 1).padStart(2, '0')}</span>
                  </button>
                  <button type="button" className="photo-favorite" aria-pressed={saved} aria-label={saved ? `Quitar ${item.name} de favoritas` : `Guardar ${item.name} en favoritas`} onClick={() => markFavorite(item.id)}>{saved ? '♥' : '♡'}</button>
                  {isAdminPreview && <button type="button" className="gallery-photo-remove" title="Quitar fotografía" aria-label={`Quitar ${item.name} de este álbum`} onClick={() => removePhoto(item.id)} disabled={locked}>✕</button>}
                </div>
              )})}
            </div>
            {onlyFavorites && photos.every(item => !favorites.has(favoriteKey('local', item.id))) && <p className="gallery-instructions">Todavía no hay favoritas en este álbum. Márcalas con el corazón.</p>}
          </>
        )}
      </>}

      <p className="gallery-privacy">PRUEBA LOCAL: los álbumes y fotografías se guardan en IndexedDB de este navegador y sobreviven a recargas y reinicios. NO es copia de seguridad: se pueden perder si borras los datos del sitio, usas modo privado o el navegador libera almacenamiento. No se suben a internet ni se modifican los originales. La privacidad real y el acceso por sellos llegarán con el servidor.</p>

      {photo && selected !== null && active && (
        <div className="gallery-lightbox" role="dialog" aria-modal="true" aria-label={`Fotografía ${selected + 1} de ${photos.length} del álbum ${currentEvent.name}`}>
          <div className="gallery-lightbox-header">
            <span className="gallery-lightbox-title">DANZ · {currentEvent.name} <span>{selected + 1} / {photos.length}</span></span>
            <button className="gallery-lightbox-close" onClick={() => setSelected(null)} aria-label="Cerrar fotografía">CERRAR ✕</button>
          </div>
          <div className="gallery-lightbox-viewer">
            {photos.length > 1 && <button className="gallery-lightbox-arrow" onClick={previous} aria-label="Fotografía anterior">←</button>}
            <div className={`gallery-lightbox-stage${viewerZoom > 1 ? ' is-zoomed' : ''}`} onPointerDown={onViewerDown} onPointerMove={onViewerMove} onPointerUp={onViewerUp} onPointerCancel={() => { pointers.current.clear(); pinchStart.current = null; drag.current = null }} onDoubleClick={() => { if (lastPointerType.current !== 'touch') toggleViewerZoom() }}>
              <ProgressiveImage className="gallery-lightbox-image" fit="contain" eager src={photo.url} alt={photo.name} style={viewerZoom > 1 ? { transform: `translate(${viewerPan.x}px, ${viewerPan.y}px) scale(${viewerZoom})` } : undefined} />
            </div>
            {photos.length > 1 && <button className="gallery-lightbox-arrow" onClick={next} aria-label="Fotografía siguiente">→</button>}
          </div>
          <p className="gallery-instructions">{viewerZoom > 1 ? 'Arrastra para recorrer la foto. Doble toque para ajustar.' : 'Desliza para pasar de foto, hacia abajo para cerrar, o pellizca para ampliar.'}</p>
          <div className="gallery-lightbox-footer">
            <span title={photo.name}>{photo.name}</span>
            <div className="gallery-lightbox-actions">
              <button type="button" className="gallery-lightbox-favorite" aria-pressed={favorites.has(favoriteKey('local', photo.id))} onClick={() => markFavorite(photo.id)}>{favorites.has(favoriteKey('local', photo.id)) ? 'EN FAVORITAS ♥' : 'GUARDAR FAVORITA ♡'}</button>
              <a className="gallery-lightbox-download" href={photo.url} download={photo.name || 'danz-foto'}>DESCARGAR FOTO ↓</a>
              {isAdminPreview && <button type="button" className="gallery-lightbox-remove" onClick={() => removePhoto(photo.id)} disabled={locked}>QUITAR FOTO ✕</button>}
            </div>
            <span>ESC PARA CERRAR</span>
          </div>
        </div>
      )}
    </section>
  )
}
