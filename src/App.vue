<script setup lang="ts">
import * as THREE from 'three'

const canvasRef = ref<HTMLCanvasElement | null>(null)

onMounted(() => {
  if (!canvasRef.value)
    return

  const scene = new THREE.Scene()
  const camera = new THREE.PerspectiveCamera(
    75,
    window.innerWidth / window.innerHeight,
    0.1,
    1000,
  )
  camera.position.z = 5

  const renderer = new THREE.WebGLRenderer({
    canvas: canvasRef.value,
    antialias: true,
  })
  renderer.setSize(window.innerWidth, window.innerHeight)
  renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))

  window.addEventListener('resize', () => {
    camera.aspect = window.innerWidth / window.innerHeight
    camera.updateProjectionMatrix()
    renderer.setSize(window.innerWidth, window.innerHeight)
    renderer.setPixelRatio(Math.min(window.devicePixelRatio, 2))
  })

  const animate = () => {
    requestAnimationFrame(animate)
    renderer.render(scene, camera)
  }
  animate()
})
</script>

<template>
  <canvas ref="canvasRef" />
</template>
