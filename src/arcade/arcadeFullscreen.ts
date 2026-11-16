let wanted = false
let pending = false
let owned = false

/** Call synchronously from the user's launch/play gesture. CSS stays immersive if denied. */
export function requestArcadeFullscreen() {
  wanted = true
  if (document.fullscreenElement || pending || !document.documentElement.requestFullscreen) return
  if (navigator.userActivation && !navigator.userActivation.isActive) return
  pending = true
  try {
    void document.documentElement.requestFullscreen({ navigationUI: 'hide' }).then(() => {
      pending = false
      owned = document.fullscreenElement === document.documentElement
      if (!wanted && owned) releaseArcadeFullscreen()
    }).catch(() => { pending = false; owned = false })
  } catch { pending = false; owned = false }
}

export function releaseArcadeFullscreen() {
  wanted = false
  if (owned && document.fullscreenElement === document.documentElement) void document.exitFullscreen().catch(() => {})
  owned = false
}
