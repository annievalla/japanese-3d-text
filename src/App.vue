<script setup lang="ts">
import GUI from 'lil-gui'
import * as THREE from 'three'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { getCurrentDateInJapanese } from './utils/dateUtils'
// Utils
import { createTextMesh } from './utils/three/geometryUtils'
import { createDonuts, createExclusionZone } from './utils/three/sceneObjects'

// Initialize Three.js scene with composable
const {
  canvasRef,
  initScene,
  startCameraAnimation,
  startAnimationLoop,
  getScene,
  getCamera: _getCamera,
  getRenderer: _getRenderer,
} = useThreeScene({
  cameraPosition: { x: 0, y: 0, z: 70 },
  lookAt: { x: 0, y: 0, z: 0 },
})

// Get text animation helper
const { animateFloatingText } = useTextAnimation({
  speedFactor: 0.5,
  rotationAmplitudeX: 0.4,
  rotationAmplitudeZ: 0.3,
})

// Text group reference
let textGroup: THREE.Group | null = null

// Load scene assets
function loadAssets(): void {
  const scene = getScene()
  if (!scene)
    return

  // Textures
  const textureLoader = new THREE.TextureLoader()
  const matcapTexture = textureLoader.load('/src/assets/textures/matcaps/8.png')
  matcapTexture.colorSpace = THREE.SRGBColorSpace

  // Fonts
  const fontLoader = new FontLoader()
  fontLoader.load('/src/assets/fonts/Noto_Sans_JP_SemiBold_Regular.json', (font) => {
    const { firstLine, secondLine } = getCurrentDateInJapanese()

    // Create material to be shared by both text meshes
    const material = new THREE.MeshMatcapMaterial({ matcap: matcapTexture })

    // Create text group
    textGroup = new THREE.Group()

    // Create and add text meshes
    textGroup.add(createTextMesh(firstLine, {
      font,
      material,
      size: 0.2,
      depth: 0.2,
      position: { y: 0.2 },
    }))
    textGroup.add(createTextMesh(secondLine, {
      font,
      material,
      size: 0.5,
      depth: 0.2,
      position: { y: -0.4 },
    }))

    // Add to scene
    scene.add(textGroup)

    // Calculate exclusion zone around text
    const exclusionZone = createExclusionZone(textGroup, 0.3)

    // Add donuts around the text
    createDonuts(45, material, scene, exclusionZone)
  })
}

// Custom animation function for the animation loop
function customAnimation(elapsedTime: number): void {
  // Animate text group if it exists
  if (textGroup) {
    animateFloatingText(textGroup, elapsedTime)
  }
}

// Initialize everything when component is mounted
onMounted(() => {
  if (!canvasRef.value)
    return

  // Initialize GUI for debugging (not actively used)
  const _gui = new GUI()

  // Setup scene
  initScene()

  // Load assets
  loadAssets()

  // Start camera animation
  startCameraAnimation({ x: 0.34, y: -1.5, z: 2 }, 4)

  // Start animation loop with custom animation function
  startAnimationLoop(customAnimation)
})
</script>

<template>
  <canvas ref="canvasRef" class="webgl" />
</template>
