import { useEffect, useRef, useState } from 'react'
import * as THREE from 'three'
import KartSilhouette from './KartSilhouette'
import { buildKart } from './models3d'
import type { KartBuild } from './garage'
import type { KartQuality } from './preferences'

/**
 * Low-power garage showroom. Reuses the actual in-race kart meshes, not a
 * separate mock-up. Flat and unavailable WebGL keep the detailed SVG fallback.
 */
export default function KartShowroom({ build, quality }: { build: KartBuild; quality: KartQuality }) {
  const host = useRef<HTMLDivElement>(null)
  const [ready, setReady] = useState(false)
  const [failed, setFailed] = useState(false)

  useEffect(() => {
    const element = host.current
    if (!element || quality === 'flat' || failed) return
    let renderer: THREE.WebGLRenderer | null = null
    let observer: ResizeObserver | null = null
    let timer = 0
    let live = true
    const canvas = document.createElement('canvas')
    canvas.setAttribute('aria-hidden', 'true')
    canvas.className = 'kart-showroom-canvas'
    element.appendChild(canvas)

    const scene = new THREE.Scene()
    const camera = new THREE.PerspectiveCamera(42, 1, 1, 1000)
    const model = buildKart(build, 0)
    const pedestalGeometry = new THREE.CylinderGeometry(51, 55, 3, 48)
    const pedestalMaterial = new THREE.MeshStandardMaterial({ color: '#162d33', metalness: .42, roughness: .34 })
    const pedestal = new THREE.Mesh(pedestalGeometry, pedestalMaterial)
    pedestal.position.y = -2
    scene.add(pedestal, model.root)
    scene.add(new THREE.HemisphereLight('#f6edd7', '#192a3a', 2.2))
    const key = new THREE.DirectionalLight('#fff0dc', 3)
    key.position.set(30, 85, 80)
    scene.add(key)
    const rim = new THREE.DirectionalLight('#b6a2ff', 2)
    rim.position.set(-70, 55, -60)
    scene.add(rim)

    const reduced = window.matchMedia('(prefers-reduced-motion: reduce)')
    let visible = true
    const visibility = new IntersectionObserver(entries => { visible = Boolean(entries[0]?.isIntersecting) })
    visibility.observe(element)
    try {
      renderer = new THREE.WebGLRenderer({
        canvas, alpha: true, antialias: quality === 'high', powerPreference: 'low-power'
      })
      renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, quality === 'high' ? 1.5 : 1.15))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      const resize = () => {
        if (!renderer || !live) return
        const rect = element.getBoundingClientRect()
        const width = Math.max(1, Math.min(390, rect.width))
        const height = Math.max(1, Math.min(180, rect.height))
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.setSize(width, height, false)
      }
      observer = new ResizeObserver(resize)
      observer.observe(element)
      resize()
      camera.position.set(96, 74, 104)
      camera.lookAt(0, 15, 0)
      const render = () => {
        if (!renderer || !live || !visible || document.visibilityState !== 'visible') return
        model.root.rotation.y = reduced.matches ? -.22 : -.22 + Math.sin(performance.now() / 2800) * .20
        renderer.render(scene, camera)
        if (!ready) setReady(true)
      }
      // Cap at ~15 FPS in a menu; stop all rendering on unmount. The approved
      // driving renderer owns the full frame budget when a race is active.
      render()
      if (!reduced.matches) timer = window.setInterval(render, 70)
    } catch {
      setFailed(true)
    }

    return () => {
      live = false
      if (timer) window.clearInterval(timer)
      observer?.disconnect()
      visibility.disconnect()
      model.root.traverse(obj => {
        if (obj instanceof THREE.Mesh) obj.geometry.dispose()
      })
      pedestalGeometry.dispose()
      pedestalMaterial.dispose()
      model.paint.dispose()
      renderer?.dispose()
      renderer?.forceContextLoss()
      canvas.remove()
    }
  }, [build.chassis, build.wheels, build.color, build.driver, quality, failed])

  if (quality === 'flat' || failed) return <KartSilhouette build={build}/>
  return <div ref={host} className="kart-showroom" data-ready={ready ? 'true' : 'false'}>
    <div className="kart-showroom-fallback"><KartSilhouette build={build}/></div>
    <span className="kart-showroom-caption" aria-hidden="true">DANZ / GARAGE 3D</span>
  </div>
}
