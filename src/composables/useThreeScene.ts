import gsap from 'gsap'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'

export interface ThreeSceneOptions {
  cameraPosition?: { x: number, y: number, z: number }
  lookAt?: { x: number, y: number, z: number }
  enableOrbitControls?: boolean
  pixelRatioLimit?: number
}

export function useThreeScene(options: ThreeSceneOptions = {}) {
  // Set default options
  const defaultOptions: Required<ThreeSceneOptions> = {
    cameraPosition: { x: 0, y: 0, z: 70 },
    lookAt: { x: 0, y: 0, z: 0 },
    enableOrbitControls: true,
    pixelRatioLimit: 2,
  }

  const opts = { ...defaultOptions, ...options }

  // Refs
  const canvasRef = ref<HTMLCanvasElement | null>(null)

  // Three.js objects (initialized as undefined)
  let scene: THREE.Scene | undefined
  let camera: THREE.PerspectiveCamera | undefined
  let renderer: THREE.WebGLRenderer | undefined
  let controls: OrbitControls | undefined
  let clock: THREE.Clock | undefined
  let animationFrameId: number | undefined

  // Animation state
  const cameraAnimationComplete = ref(false)

  /**
   * Initialize the Three.js scene
   */
  function initScene() {
    if (!canvasRef.value)
      return

    // Create scene
    scene = new THREE.Scene()

    // Setup sizing
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    // Create camera
    camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
    camera.position.set(
      opts.cameraPosition.x,
      opts.cameraPosition.y,
      opts.cameraPosition.z,
    )
    camera.lookAt(
      new THREE.Vector3(opts.lookAt.x, opts.lookAt.y, opts.lookAt.z),
    )
    scene.add(camera)

    // Setup renderer
    renderer = new THREE.WebGLRenderer({
      canvas: canvasRef.value,
      antialias: true,
    })
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.pixelRatioLimit))

    // Setup controls
    if (opts.enableOrbitControls) {
      controls = new OrbitControls(camera, canvasRef.value)
      controls.enabled = false // Disabled until animation completes
      controls.enableDamping = true
    }

    // Initialize clock
    clock = new THREE.Clock()

    // Setup resize handler
    window.addEventListener('resize', handleResize)
  }

  /**
   * Handle window resize
   */
  function handleResize() {
    if (!camera || !renderer)
      return

    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, opts.pixelRatioLimit))
  }

  /**
   * Start camera entrance animation
   */
  function startCameraAnimation(targetPosition = { x: 0.34, y: -1.5, z: 2 }, duration = 4) {
    if (!camera)
      return

    gsap.to(camera.position, {
      x: targetPosition.x,
      y: targetPosition.y,
      z: targetPosition.z,
      duration,
      ease: 'power3.inOut',
      onComplete: () => {
        cameraAnimationComplete.value = true
        if (controls)
          controls.enabled = true
      },
    })
  }

  /**
   * Animation loop
   */
  function startAnimationLoop(customAnimationFn?: (elapsedTime: number) => void) {
    if (!scene || !camera || !renderer || !clock)
      return

    const animate = () => {
      const elapsedTime = clock!.getElapsedTime()

      // Look at center
      camera!.lookAt(new THREE.Vector3(opts.lookAt.x, opts.lookAt.y, opts.lookAt.z))

      // Update controls if enabled
      if (controls && controls.enabled) {
        controls.update()
      }

      // Run custom animation if provided
      if (customAnimationFn) {
        customAnimationFn(elapsedTime)
      }

      // Render
      renderer!.render(scene!, camera!)

      // Continue loop
      animationFrameId = requestAnimationFrame(animate)
    }

    animate()
  }

  /**
   * Stop animation loop and clean up
   */
  function cleanup() {
    window.removeEventListener('resize', handleResize)

    if (animationFrameId) {
      cancelAnimationFrame(animationFrameId)
    }

    // Dispose materials, geometries, etc.
    if (scene) {
      scene.traverse((object) => {
        if (object instanceof THREE.Mesh) {
          if (object.geometry)
            object.geometry.dispose()

          if (object.material) {
            if (Array.isArray(object.material)) {
              object.material.forEach(material => material.dispose())
            }
            else {
              object.material.dispose()
            }
          }
        }
      })
    }
  }

  // Perform cleanup on component unmount
  onBeforeUnmount(() => {
    cleanup()
  })

  // Return the composable API
  return {
    canvasRef,
    initScene,
    startCameraAnimation,
    startAnimationLoop,
    cleanup,
    cameraAnimationComplete,
    // Getters to ensure we don't expose undefined objects
    getScene: () => scene,
    getCamera: () => camera,
    getRenderer: () => renderer,
    getControls: () => controls,
    getClock: () => clock,
  }
}
