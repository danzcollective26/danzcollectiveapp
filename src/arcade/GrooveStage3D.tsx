import { useEffect, useRef } from 'react'
import * as THREE from 'three'
import { grooveStagePixelRatio } from './grooveRenderBudget'

/**
 * Real perspective scenery underneath the existing SVG hit plane.
 * One WebGL frame on resize/stage change: no new game animation loop.
 * On unsupported GPUs the approved SVG booth remains the fallback.
 */
export default function GrooveStage3D({ stage, onReady }: { stage: number; onReady: (ready: boolean) => void }) {
  const ref = useRef<HTMLCanvasElement>(null)
  useEffect(() => {
    const canvas = ref.current
    if (!canvas) return
    let renderer: THREE.WebGLRenderer | null = null
    let observer: ResizeObserver | null = null
    const scene = new THREE.Scene()
    scene.background = new THREE.Color('#0a1019')
    scene.fog = new THREE.FogExp2('#090d15', 0.023)
    const camera = new THREE.PerspectiveCamera(65, 640 / 760, .1, 140)
    camera.position.set(0, 2.8, 13)
    camera.lookAt(0, .5, -23)
    const accent = new THREE.Color(stage === 1 ? '#f4b56b' : stage === 2 ? '#70d2f5' : '#e48cde')
    const materials: THREE.Material[] = []
    const make = (color: string, emissive = '#000000', strength = 0) => {
      const mat = new THREE.MeshStandardMaterial({ color, emissive, emissiveIntensity: strength, roughness: .78, metalness: .17 })
      materials.push(mat)
      return mat
    }
    const dark = make('#19242e'), wall = make('#202b39'), ceiling = make('#101820')
    const trim = make('#4e5f65'), oak = make('#463023'), light = make('#dde8dd', accent.getStyle(), 2.2)
    const beam = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .045, depthWrite: false, side: THREE.DoubleSide })
    materials.push(beam)
    const addBox = (w: number, h: number, d: number, material: THREE.Material, x: number, y: number, z: number) => {
      const cube = new THREE.Mesh(new THREE.BoxGeometry(w, h, d), material)
      cube.position.set(x, y, z)
      scene.add(cube)
      return cube
    }
    const floor = new THREE.Mesh(new THREE.PlaneGeometry(50, 100), make('#293039'))
    floor.rotation.x = -Math.PI / 2
    floor.position.set(0, -4.5, -30)
    scene.add(floor)
    addBox(30, 17, .5, wall, 0, 3.5, -45)
    addBox(.6, 17, 85, wall, -15, 3.5, -27)
    addBox(.6, 17, 85, wall, 15, 3.5, -27)
    addBox(30, .5, 85, ceiling, 0, 12, -27)
    addBox(18, 1.4, 15, oak, 0, -3.8, -35)
    for (const side of [-1, 1]) {
      addBox(1.1, 12, 78, dark, side * 14.4, 2, -25)
      for (let row = 0; row < 5; row++) {
        const z = -4 - row * 9
        addBox(1, .25, 6, trim, side * 14, -2.9, z)
        addBox(.7, .75, 6, light, side * 14, 9.2, z)
      }
      for (const z of [-34, -21]) {
        addBox(3.2, 9, 2.6, dark, side * 9, .4, z)
        for (const y of [-1.4, 3.2]) {
          const housing = new THREE.Mesh(new THREE.CylinderGeometry(1.15, 1.15, .22, 24), trim)
          housing.rotation.x = Math.PI / 2
          housing.position.set(side * 9, y, z + 1.39)
          scene.add(housing)
          const driver = new THREE.Mesh(new THREE.CylinderGeometry(.78, .78, .3, 24), dark)
          driver.rotation.x = Math.PI / 2
          driver.position.set(side * 9, y, z + 1.55)
          scene.add(driver)
        }
      }
    }
    // Receding luminous frames give the booth visible perspective and scale.
    // Static geometry only: zero extra animation frames during play.
    const neon = new THREE.MeshBasicMaterial({ color: accent, transparent: true, opacity: .78 })
    materials.push(neon)
    for (const z of [-10, -22, -34, -43]) {
      addBox(.22, 13.5, .24, neon, -13.4, 3, z)
      addBox(.22, 13.5, .24, neon, 13.4, 3, z)
      addBox(27, .22, .24, neon, 0, 9.7, z)
      addBox(27, .12, .24, trim, 0, -4.15, z)
    }
    // The collective's six-petal emblem anchors the far wall without using
    // copyrighted imagery or loading a new texture on every stage transition.
    const emblem = new THREE.Group()
    const petalMaterial = new THREE.MeshBasicMaterial({ color: accent, side: THREE.DoubleSide })
    materials.push(petalMaterial)
    const petalGeometry = new THREE.CircleGeometry(1.65, 24)
    for (let n = 0; n < 6; n++) {
      const angle = n * Math.PI / 3
      const petal = new THREE.Mesh(petalGeometry, petalMaterial)
      petal.position.set(Math.cos(angle) * 2.7, Math.sin(angle) * 2.7, 0)
      petal.scale.set(.82, 1.17, 1)
      petal.rotation.z = angle - Math.PI / 2
      emblem.add(petal)
    }
    const center = new THREE.Mesh(new THREE.CircleGeometry(.9, 24), make('#f3e7d5'))
    emblem.add(center)
    emblem.position.set(0, 3.1, -44.6)
    scene.add(emblem)
    for (const z of [-8, -23, -37]) {
      addBox(28, .6, .8, trim, 0, 11.6, z)
      for (const x of [-9, -3, 3, 9]) {
        addBox(1.5, .7, 1.5, light, x, 11, z)
        const cone = new THREE.Mesh(new THREE.ConeGeometry(3.4, 21, 16, 1, true), beam)
        cone.rotation.x = Math.PI
        cone.position.set(x, .1, z)
        scene.add(cone)
      }
    }
    const ambient = new THREE.HemisphereLight('#b8c8e6', '#291c18', 1.5)
    const key = new THREE.PointLight(accent, 75, 85)
    key.position.set(-4, 9, -20)
    const fill = new THREE.PointLight(accent, 42, 75)
    fill.position.set(9, 5, -38)
    scene.add(ambient, key, fill)
    let alive = true
    try {
      renderer = new THREE.WebGLRenderer({ canvas, antialias: true, alpha: false, powerPreference: 'low-power' })
      renderer.setPixelRatio(grooveStagePixelRatio(window.devicePixelRatio || 1, Math.max(1,canvas.clientWidth), Math.max(1,canvas.clientHeight)))
      renderer.outputColorSpace = THREE.SRGBColorSpace
      renderer.toneMapping = THREE.ACESFilmicToneMapping
      const paint = () => {
        if (!alive || !renderer) return
        const width = Math.max(1, canvas.clientWidth), height = Math.max(1, canvas.clientHeight)
        if (width <= 1 || height <= 1) return
        renderer.setPixelRatio(grooveStagePixelRatio(window.devicePixelRatio || 1, width, height))
        renderer.setSize(width, height, false)
        camera.aspect = width / height
        camera.updateProjectionMatrix()
        renderer.render(scene, camera)
        onReady(true)
      }
      observer = new ResizeObserver(paint)
      observer.observe(canvas)
      paint()
    } catch {
      onReady(false)
    }
    return () => {
      alive = false
      observer?.disconnect()
      scene.traverse(object => {
        if (object instanceof THREE.Mesh) object.geometry.dispose()
      })
      materials.forEach(material => material.dispose())
      renderer?.dispose()
    }
  }, [stage, onReady])
  return <canvas ref={ref} className="gn-perspective-3d" aria-hidden="true" />
}
