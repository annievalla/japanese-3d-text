<script setup lang="ts">
import GUI from 'lil-gui'
import * as THREE from 'three'
import { OrbitControls } from 'three/examples/jsm/controls/OrbitControls.js'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'
import { FontLoader } from 'three/examples/jsm/loaders/FontLoader.js'
import { onMounted, ref } from 'vue'

const canvasRef = ref<HTMLCanvasElement | null>(null)
const donutRotations = new Map()

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

    // Stocker les vitesses de rotation aléatoires pour ce donut
    donutRotations.set(donut, {
      x: Math.random() * 0.5 + 0.3,
      y: Math.random() * 0.5 + 0.3, // Entre 0.3 et 0.8
    })

    scene.add(donut)
  }
}

onMounted(() => {
  if (!canvasRef.value)
    return

  // Debug
  const _gui = new GUI()

  // Scene
  const scene = new THREE.Scene()

  // Textures
  const textureLoader = new THREE.TextureLoader()
  const matcapTexture = textureLoader.load('/src/assets/textures/matcaps/8.png')
  matcapTexture.colorSpace = THREE.SRGBColorSpace

  /**
   * Fonts
   */
  const fontLoader = new FontLoader()

  fontLoader.load('/src/assets/fonts/Noto_Sans_JP_SemiBold_Regular.json', (font) => {
    const textGeometry = new TextGeometry('こんにちは', {
      font,
      size: 0.5,
      depth: 0.2,
      curveSegments: 5,
      bevelEnabled: true,
      bevelThickness: 0.03,
      bevelSize: 0.02,
      bevelOffset: 0,
      bevelSegments: 4,
    })

    textGeometry.center()

    const material = new THREE.MeshMatcapMaterial({ matcap: matcapTexture })
    const text = new THREE.Mesh(textGeometry, material)
    addDonuts(45, material, scene)
    scene.add(text)
  })

  /**
   * Sizes
   */
  const sizes = {
    width: window.innerWidth,
    height: window.innerHeight,
  }

  /**
   * Camera
   */
  const camera = new THREE.PerspectiveCamera(75, sizes.width / sizes.height, 0.1, 100)
  camera.position.x = 1
  camera.position.y = 1
  camera.position.z = 2
  scene.add(camera)

  // Controls
  const controls = new OrbitControls(camera, canvasRef.value)
  controls.enableDamping = true

  /**
   * Renderer
   */
  const renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  })
  renderer.setSize(sizes.width, sizes.height)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  window.addEventListener('resize', () => {
    // Update sizes
    sizes.width = window.innerWidth
    sizes.height = window.innerHeight

    // Update camera
    camera.aspect = sizes.width / sizes.height
    camera.updateProjectionMatrix()

    // Update renderer
    renderer.setSize(sizes.width, sizes.height)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  })

  /**
   * Animate
   */
  const clock = new THREE.Clock()

  const tick = () => {
    const elapsedTime = clock.getElapsedTime()

    // Update controls
    controls.update()

    // Animate objects
    scene.traverse((object) => {
      if (object instanceof THREE.Mesh && object.geometry instanceof THREE.TorusGeometry) {
        // Calculer la distance entre le donut et la caméra
        const distance = object.position.distanceTo(camera.position)

        // Animer uniquement les donuts proches (moins de 5 unités)
        if (distance < 7) {
          // Utiliser les vitesses de rotation uniques pour ce donut
          const rotations = donutRotations.get(object)
          if (rotations) {
            object.rotation.x = elapsedTime * rotations.x
            object.rotation.y = elapsedTime * rotations.y
          }
        }
        else {
          // Réinitialiser la rotation pour les donuts éloignés
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
})
</script>

<template>
  <canvas ref="canvasRef" class="webgl" />
</template>
