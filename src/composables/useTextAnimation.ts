import type * as THREE from 'three'

/**
 * Animation parameters for floating text
 */
export interface FloatingTextAnimationOptions {
  speedFactor?: number
  rotationAmplitudeX?: number
  rotationAmplitudeZ?: number
  rotationAmplitudeY?: number
  positionAmplitudeY?: number
  positionAmplitudeX?: number
  positionAmplitudeZ?: number
}

/**
 * Hook for creating gentle, organic animation for floating text
 */
export function useTextAnimation(options: FloatingTextAnimationOptions = {}) {
  // Default animation parameters
  const defaultOptions: Required<FloatingTextAnimationOptions> = {
    speedFactor: 0.5,
    rotationAmplitudeX: 0.4,
    rotationAmplitudeZ: 0.3,
    rotationAmplitudeY: 0.02,
    positionAmplitudeY: 0.06,
    positionAmplitudeX: 0.05,
    positionAmplitudeZ: 0.03,
  }

  const opts = { ...defaultOptions, ...options }

  /**
   * Apply gentle floating animation to a text group
   */
  function animateFloatingText(group: THREE.Group, elapsedTime: number): void {
    if (!group)
      return

    // Slow, gentle movement parameter
    const slowTime = elapsedTime * opts.speedFactor

    // Primary rotation animations
    const gentleX = Math.sin(slowTime * 0.4) * opts.rotationAmplitudeX
    const gentleZ = Math.sin(slowTime * 0.3 + 0.8) * opts.rotationAmplitudeZ

    // Secondary rotation animations
    const subtleX = Math.sin(slowTime * 0.7) * (opts.rotationAmplitudeX * 0.2)
    const subtleZ = Math.sin(slowTime * 0.6 + 0.5) * (opts.rotationAmplitudeZ * 0.2)

    // Apply rotations
    group.rotation.x = gentleX + subtleX
    group.rotation.z = gentleZ + subtleZ
    group.rotation.y = Math.sin(slowTime * 0.2 + 1.0) * opts.rotationAmplitudeY

    // Position animations for floating effect
    group.position.y = Math.sin(slowTime * 0.3) * opts.positionAmplitudeY
    group.position.x = Math.sin(slowTime * 0.15) * opts.positionAmplitudeX
    group.position.z = Math.sin(slowTime * 0.18) * opts.positionAmplitudeZ
  }

  return {
    animateFloatingText,
  }
}
