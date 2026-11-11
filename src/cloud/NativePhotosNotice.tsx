import { disableNativePhotos } from './nativePhoto'
export default function NativePhotosNotice() {
  if (new URLSearchParams(window.location.search).get('androidFotos') !== 'instalar') return null
  return <aside className="native-photos-notice" role="status"><strong>Guardar en la galería de Android</strong><p>Hace falta instalar el complemento DANZ Fotos. Si ya lo instalaste, abre su icono y pulsa «Abrir DANZ». Puedes seguir usando la descarga JPG mientras tanto.</p><button className="outline-btn" onClick={() => {
    disableNativePhotos()
    const url = new URL(window.location.href); url.searchParams.delete('androidFotos'); window.location.assign(url)
  }}>SEGUIR CON DESCARGAS JPG</button></aside>
}
