<script setup lang="ts">
import gsap from 'gsap'
import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { onMounted, ref } from 'vue'

// --------------------------------
// State and references
// --------------------------------
const canvasRef = ref<HTMLCanvasElement | null>(null)

// Scene objects
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let clock: THREE.Clock
let textGroup: THREE.Group | null = null

// Animation state
let cameraAnimationComplete = false

// --------------------------------
// Utility functions
// --------------------------------

// Get current date parts in Japanese
function getCurrentDatePartsInJapanese(): { firstLine: string, secondLine: string } {
  const today = new Date()
  const month = today.getMonth() + 1 // getMonth is 0-indexed
  const day = today.getDate()

  return {
    firstLine: '今日は',
    secondLine: `${month}月${day}日`,
  }
}

// Create a text mesh with the given parameters
function createTextMesh(
  text: string,
  font: any,
  material: THREE.Material,
  size: number = 0.2,
  depth: number = 0.2,
  yPosition: number = 0,
): THREE.Mesh {
  const textGeometry = new TextGeometry(text, {
    font,
    size,
    depth,
    curveSegments: 5,
    bevelEnabled: true,
    bevelThickness: 0.03,
    bevelSize: 0.02,
    bevelOffset: 0,
    bevelSegments: 4,
  })

  textGeometry.center()
  const textMesh = new THREE.Mesh(textGeometry, material)
  textMesh.position.y = yPosition

  return textMesh
}

// --------------------------------
// Scene setup functions
// --------------------------------

// Initialize the scene, camera, and renderer
function initializeScene(): void {
  // Create scene
  scene = new THREE.Scene()

  // Setup sizing
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  // Create camera
  camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 1000)
  camera.position.x = 0
  camera.position.y = 0
  camera.position.z = 70 // Start far
  camera.lookAt(new THREE.Vector3(0, 0, 0))
  scene.add(camera)

  // Exit if canvas isn't available
  if (!canvasRef.value)
    return

  // Setup renderer
  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  })
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  // Setup controls
  controls = new OrbitControls(camera, canvasRef.value)
  controls.enabled = false // Disable during animation
  controls.enableDamping = true

  // Initialize clock
  clock = new THREE.Clock()
}

// Load textures and fonts
function loadAssets(): void {
  // Textures
  const textureLoader = new THREE.TextureLoader()
  const matcapTexture = textureLoader.load('/src/assets/textures/matcaps/8.png')
  matcapTexture.colorSpace = THREE.SRGBColorSpace

  // Fonts
  const fontLoader = new FontLoader()
  fontLoader.load('/src/assets/fonts/Noto_Sans_JP_SemiBold_Regular.json', (font) => {
    const { firstLine, secondLine } = getCurrentDatePartsInJapanese()

    // Create material to be shared by both text meshes
    const material = new THREE.MeshMatcapMaterial({ matcap: matcapTexture })

    // Create parent object to hold both text meshes for combined animation
    textGroup = new THREE.Group()

    // Create and add text lines
    textGroup.add(createTextMesh(firstLine, font, material, 0.2, 0.2, 0.2))
    textGroup.add(createTextMesh(secondLine, font, material, 0.5, 0.2, -0.4))

    scene.add(textGroup)

    // Add donuts after adding text
    addDonuts(45, material, scene)
  })
}

// Creates donuts and adds them to the scene
function addDonuts(nbDonuts: number, material: THREE.MeshMatcapMaterial, scene: THREE.Scene): void {
  const donutGeometry = new THREE.TorusGeometry(0.35, 0.2, 20, 45)
  for (let i = 0; i < nbDonuts; i++) {
    const donut = new THREE.Mesh(donutGeometry, material)
    donut.position.x = (Math.random() - 0.5) * 10
    donut.position.y = (Math.random() - 0.5) * 10
    donut.position.z = (Math.random() - 0.5) * 10

    donut.rotation.x = Math.random() * Math.PI
    donut.rotation.y = Math.random() * Math.PI

    const randomScale = Math.random()
    donut.scale.set(randomScale, randomScale, randomScale)

    scene.add(donut)
  }
}

// Setup event listeners
function setupEventListeners(): void {
  window.addEventListener('resize', () => {
    // Update sizes
    const sizes = {
      width: window.innerWidth,
      height: window.innerHeight,
    }

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  })
}

// --------------------------------
// Animation functions
// --------------------------------

// Start camera entrance animation
function startCameraAnimation(): void {
  gsap.to(camera.position, {
    x: 0.34,
    y: -1.5,
    z: 2,
    duration: 4,
    ease: 'power3.inOut',
    onComplete: () => {
      cameraAnimationComplete = true
      controls.enabled = true
    },
  })
}

// Animate floating text with gentle, flowing movement
function animateFloatingText(elapsedTime: number): void {
  if (!textGroup)
    return

  // Slow, gentle movement parameters
  const slowTime = elapsedTime * 0.5

  // Rotation animations
  // Primary gentle rotations
  const gentleX = Math.sin(slowTime * 0.4) * 0.15
  const gentleZ = Math.sin(slowTime * 0.3 + 0.8) * 0.12

  // Secondary subtle rotations
  const subtleX = Math.sin(slowTime * 0.7) * 0.04
  const subtleZ = Math.sin(slowTime * 0.6 + 0.5) * 0.03

  // Apply rotations
  textGroup.rotation.x = gentleX + subtleX
  textGroup.rotation.z = gentleZ + subtleZ
  textGroup.rotation.y = Math.sin(slowTime * 0.2 + 1.0) * 0.02

  // Position animations
  textGroup.position.y = Math.sin(slowTime * 0.3) * 0.06 // Vertical floating
  textGroup.position.x = Math.sin(slowTime * 0.15) * 0.05 // Horizontal drift
  textGroup.position.z = Math.sin(slowTime * 0.18) * 0.03 // Depth movement
}

// Main animation loop
function animate(): void {
  const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Always look at the center during animation
    camera.lookAt(new THREE.Vector3(0, 0, 0))

    // Update controls if animation is complete
    if (cameraAnimationComplete) {
      controls.update()
    }

    // Animate floating text
    animateFloatingText(elapsedTime)

    // Render scene
    renderer.render(scene, camera)

    // Continue animation loop
    window.requestAnimationFrame(tick)
  }

  tick()
}

// --------------------------------
// Initialization
// --------------------------------
onMounted(() => {
  if (!canvasRef.value)
    return

  // Initialize GUI (not actively used)
  const _gui = new GUI()

  // Setup and start scene
  initializeScene()
  loadAssets()
  setupEventListeners()
  startCameraAnimation()
  animate()
})
</script>

<template>
  <canvas ref="canvasRef" class="webgl" />
</template>
