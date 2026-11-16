let wanted = false
let pending = false
let owned = false
const status = (value: string) => { document.documentElement.dataset.arcadeFullscreen = value }

/** Call synchronously from the user's launch/play gesture. CSS stays immersive if denied. */
export function requestArcadeFullscreen() {
  wanted = true
  if (document.fullscreenElement) { status('active'); return }
  if (pending) return
  if (!document.documentElement.requestFullscreen) { status('unavailable'); return }
  pending = true; status('pending')
  try {
    void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => {
      pending = false
      owned = document.fullscreenElement === document.documentElement
      status(owned ? 'active' : 'unavailable')
      if (!wanted && owned) releaseArcadeFullscreen()
    }).catch(() => { pending = false; owned = false; status('unavailable') })
  } catch { pending = false; owned = false; status('unavailable') }
}

export function releaseArcadeFullscreen() {
  wanted = false
  if (owned && document.fullscreenElement === document.documentElement) void document.exitFullscreen().catch(() => {})
  owned = false; status('windowed')
}
