import * as THREE from 'three'
import { calculateGroupBoundingBox } from './geometryUtils'

export interface ExclusionZone {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

/**
 * Creates a zone of exclusion around an object with a margin
 */
export function createExclusionZone(group: THREE.Group, margin: number = 0.3): ExclusionZone {
  const bounds = calculateGroupBoundingBox(group)

  return {
    minX: bounds.min.x - margin,
    maxX: bounds.max.x + margin,
    minY: bounds.min.y - margin,
    maxY: bounds.max.y + margin,
    minZ: bounds.min.z - margin,
    maxZ: bounds.max.z + margin,
  }
}

/**
 * Check if a position is outside an exclusion zone
 */
export function isOutsideExclusionZone(
  x: number,
  y: number,
  z: number,
  zone: ExclusionZone,
): boolean {
  return (
    x < zone.minX
    || x > zone.maxX
    || y < zone.minY
    || y > zone.maxY
    || z < zone.minZ
    || z > zone.maxZ
  )
}

/**
 * Creates donuts and adds them to the scene, avoiding the exclusion zone
 */
export function createDonuts(
  nbDonuts: number,
  material: THREE.MeshMatcapMaterial,
  scene: THREE.Scene,
  exclusionZone: ExclusionZone,
  spaceSize: number = 10, // Size of the space in which to distribute donuts
): void {
  const donutGeometry = new THREE.TorusGeometry(0.35, 0.2, 20, 45)

  for (let i = 0; i < nbDonuts; i++) {
    const donut = new THREE.Mesh(donutGeometry, material)

    // Generate random position
    let x = (Math.random() - 0.5) * spaceSize
    let y = (Math.random() - 0.5) * spaceSize
    let z = (Math.random() - 0.5) * spaceSize

    // Ensure donut is outside the exclusion zone
    // Try up to 10 times to find a valid position
    let attempts = 0
    const maxAttempts = 10

    while (!isOutsideExclusionZone(x, y, z, exclusionZone) && attempts < maxAttempts) {
      x = (Math.random() - 0.5) * spaceSize
      y = (Math.random() - 0.5) * spaceSize
      z = (Math.random() - 0.5) * spaceSize
      attempts++
    }

    // Position the donut
    donut.position.x = x
    donut.position.y = y
    donut.position.z = z

    // Random rotation
    donut.rotation.x = Math.random() * Math.PI
    donut.rotation.y = Math.random() * Math.PI

    // Random scaling
    const randomScale = Math.random()
    donut.scale.set(randomScale, randomScale, randomScale)

    scene.add(donut)
  }
}
