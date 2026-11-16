/** Local preview only. The stored/downloaded original is never replaced. */
export async function photoThumbnail(blob: Blob): Promise<Blob | undefined> {
  if (!['image/jpeg', 'image/png', 'image/webp', 'image/avif'].includes(blob.type)) return
  const url = URL.createObjectURL(blob)
  try {
    const image = new Image()
    await new Promise<void>((resolve, reject) => {
      const timeout = setTimeout(() => { image.src = ''; reject(new Error('Preview deadline')) }, 5000)
      image.onload = () => { clearTimeout(timeout); resolve() }
      image.onerror = () => { clearTimeout(timeout); reject(new Error('Preview unavailable')) }
      image.src = url
    })
    if (Math.max(image.naturalWidth, image.naturalHeight) <= 640) return
    const scale = 640 / Math.max(image.naturalWidth, image.naturalHeight)
    const canvas = document.createElement('canvas')
    canvas.width = Math.max(1, Math.round(image.naturalWidth * scale)); canvas.height = Math.max(1, Math.round(image.naturalHeight * scale))
    const context = canvas.getContext('2d')
    if (!context) return
    context.drawImage(image, 0, 0, canvas.width, canvas.height)
    const preview = await new Promise<Blob | null>(resolve => canvas.toBlob(resolve, 'image/webp', .78))
    return preview && preview.size < blob.size ? preview : undefined
  } catch { return undefined }
  finally { URL.revokeObjectURL(url) }
}
