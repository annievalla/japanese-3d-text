<script setup lang="ts">
import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { onMounted, ref } from 'vue'

// State and references
const canvasRef = ref<HTMLCanvasElement | null>(null)
const donutRotations = new Map()

// Scene objects
let scene: THREE.Scene
let camera: THREE.PerspectiveCamera
let renderer: THREE.WebGLRenderer
let controls: OrbitControls
let clock: THREE.Clock

// Creates donuts and adds them to the scene
function addDonuts(nbDonuts: number, material: THREE.MeshMatcapMaterial, scene: THREE.Scene) {
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

    // Store random rotation speeds for this donut
    donutRotations.set(donut, {
      x: Math.random() * 0.5 + 0.3,
      y: Math.random() * 0.5 + 0.3, // Between 0.3 and 0.8
    })

    scene.add(donut)
  }
}

// Initialize the scene, camera, and renderer
function initializeScene() {
  scene = new THREE.Scene()

  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
  camera.position.x = 1
  camera.position.y = 1
  camera.position.z = 2
  scene.add(camera)

  if (!canvasRef.value)
    return

  renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  })
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  controls = new OrbitControls(camera, canvasRef.value)
  controls.enableDamping = true

  clock = new THREE.Clock()
}

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

// Load textures and fonts
function loadAssets() {
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

    // Create and add first line text
    const firstLineText = createTextMesh(firstLine, font, material, 0.2, 0.2, 0.2)
    scene.add(firstLineText)

    // Create and add second line text
    const secondLineText = createTextMesh(secondLine, font, material, 0.5, 0.2, -0.4)
    scene.add(secondLineText)

    // Add donuts after adding both text elements
    addDonuts(45, material, scene)
  })
}

// Setup event listeners
function setupEventListeners() {
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

// Animation loop
function animate() {
  const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Animate objects
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry instanceof THREE.TorusGeometry) {
        // Calculate the distance between the donut and the camera
        const distance = object.position.distanceTo(camera.position)

        // Animate only the donuts close to the camera
        if (distance < 7) {
          // Use the unique rotation speeds for this donut
          const rotations = donutRotations.get(object)
          if (rotations) {
            object.rotation.x = elapsedTime * rotations.x
            object.rotation.y = elapsedTime * rotations.y
          }
        }
        else {
          // Reset the rotation for the distant donuts
          object.rotation.x = 0
          object.rotation.y = 0
        }
      }
    })

    // Render
    renderer.render(scene, camera)

    // Call tick again on the next frame
    window.requestAnimationFrame(tick)
  }

  tick()
}

// Initialize the scene when component is mounted
onMounted(() => {
  if (!canvasRef.value)
    return

  // Initialize GUI but not using it for now
  const _gui = new GUI()

  initializeScene()
  loadAssets()
  setupEventListeners()
  animate()
})
</script>

<template>
  <canvas ref="canvasRef" class="webgl" />
</template>
