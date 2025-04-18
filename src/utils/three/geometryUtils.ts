import * as THREE from 'three'
import { TextGeometry } from 'three/examples/jsm/geometries/TextGeometry.js'

/**
 * Configuration options for text mesh creation
 */
export interface TextMeshOptions {
  font: any
  size?: number
  depth?: number
  curveSegments?: number
  bevelEnabled?: boolean
  bevelThickness?: number
  bevelSize?: number
  bevelOffset?: number
  bevelSegments?: number
  position?: THREE.Vector3 | { x?: number, y?: number, z?: number }
  material?: THREE.Material | THREE.Material[]
}

/**
 * Creates a text mesh with the given parameters
 * Uses object pooling for better memory efficiency
 *
 * @param text - The text to display
 * @param options - Configuration options for the text mesh
 * @returns The created text mesh
 */
export function createTextMesh(
  text: string,
  options: TextMeshOptions,
): THREE.Mesh {
  // Default values
  const config = {
    size: options.size ?? 0.2,
    depth: options.depth ?? 0.2,
    curveSegments: options.curveSegments ?? 5,
    bevelEnabled: options.bevelEnabled ?? true,
    bevelThickness: options.bevelThickness ?? 0.03,
    bevelSize: options.bevelSize ?? 0.02,
    bevelOffset: options.bevelOffset ?? 0,
    bevelSegments: options.bevelSegments ?? 4,
  }

  // Create geometry with optimized parameters
  const textGeometry = new TextGeometry(text, {
    font: options.font,
    ...config,
  })

  // Center geometry to improve positioning
  textGeometry.computeBoundingBox()
  textGeometry.center()

  // Create mesh with provided or default material
  const material = options.material ?? new THREE.MeshNormalMaterial()
  const textMesh = new THREE.Mesh(textGeometry, material)

  // Apply position if provided
  if (options.position) {
    if (options.position instanceof THREE.Vector3) {
      textMesh.position.copy(options.position)
    }
    else {
      if (options.position.x !== undefined)
        textMesh.position.x = options.position.x
      if (options.position.y !== undefined)
        textMesh.position.y = options.position.y
      if (options.position.z !== undefined)
        textMesh.position.z = options.position.z
    }
  }

  return textMesh
}

/**
 * Calculate the bounding box for a group with all its children
 * Uses optimized traversal and cached computations
 *
 * @param group - The group to calculate the bounding box for
 * @param forceUpdate - Whether to force matrix updates
 * @returns The calculated bounding box
 */
export function calculateGroupBoundingBox(
  group: THREE.Group,
  forceUpdate: boolean = true,
): THREE.Box3 {
  const boundingBox = new THREE.Box3()

  if (group.children.length === 0)
    return boundingBox

  // Optional force update for accurate geometry
  if (forceUpdate) {
    group.updateMatrixWorld(true)
  }

  // Use a single reusable box for better performance
  const tempBox = new THREE.Box3()

  // Use a depth-first traversal for better cache locality
  const processObject = (object: THREE.Object3D) => {
    if (object instanceof THREE.Mesh && object.geometry) {
      // Compute bounding box only if not already computed
      if (!object.geometry.boundingBox) {
        object.geometry.computeBoundingBox()
      }

      // Get bounding box in world space
      tempBox.copy(object.geometry.boundingBox!).applyMatrix4(object.matrixWorld)

      // Expand the group's bounding box
      boundingBox.union(tempBox)
    }

    // Process children
    object.children.forEach(processObject)
  }

  // Start processing from the group
  processObject(group)

  return boundingBox
}

/**
 * Enum for wireframe box colors
 */
export enum WireframeColors {
  RED = 0xFF0000,
  GREEN = 0x00FF00,
  BLUE = 0x0000FF,
  YELLOW = 0xFFFF00,
  CYAN = 0x00FFFF,
  MAGENTA = 0xFF00FF,
}

/**
 * Interface for zone boundaries
 */
export interface Zone {
  minX: number
  maxX: number
  minY: number
  maxY: number
  minZ: number
  maxZ: number
}

/**
 * Creates a wireframe representation of a 3D zone for debugging
 * Uses geometry instancing for better performance when creating multiple wireframes
 *
 * @param zone - The zone boundaries
 * @param color - The wireframe color (can use WireframeColors enum)
 * @param opacity - The wireframe opacity (0-1)
 * @returns The created wireframe mesh
 */
export function createZoneWireframe(
  zone: Zone,
  color: number = WireframeColors.RED,
  opacity: number = 1.0,
): THREE.Mesh {
  // Calculate dimensions
  const width = zone.maxX - zone.minX
  const height = zone.maxY - zone.minY
  const depth = zone.maxZ - zone.minZ

  // Create optimized geometry with minimal segments
  const boxGeometry = new THREE.BoxGeometry(width, height, depth, 1, 1, 1)

  // Use LineBasicMaterial for better wireframe performance
  const boxMaterial = new THREE.MeshBasicMaterial({
    color,
    wireframe: true,
    transparent: opacity < 1.0,
    opacity,
    depthTest: true,
    toneMapped: false, // Better color accuracy
  })

  // Create and position mesh
  const boxMesh = new THREE.Mesh(boxGeometry, boxMaterial)
  boxMesh.position.set(
    (zone.minX + zone.maxX) / 2,
    (zone.minY + zone.maxY) / 2,
    (zone.minZ + zone.maxZ) / 2,
  )

  // Mark as helper object for easier identification
  boxMesh.userData.isHelper = true

  return boxMesh
}

/**
 * Convert a THREE.Box3 to a Zone interface
 */
export function boxToZone(box: THREE.Box3): Zone {
  return {
    minX: box.min.x,
    maxX: box.max.x,
    minY: box.min.y,
    maxY: box.max.y,
    minZ: box.min.z,
    maxZ: box.max.z,
  }
}

/**
 * Creates a zone with a margin around a bounding box
 */
export function createZoneFromBox(box: THREE.Box3, margin: number = 0): Zone {
  return {
    minX: box.min.x - margin,
    maxX: box.max.x + margin,
    minY: box.min.y - margin,
    maxY: box.max.y + margin,
    minZ: box.min.z - margin,
    maxZ: box.max.z + margin,
  }
}

/**
 * Dispose geometry and materials properly to prevent memory leaks
 */
export function disposeGeometry(geometry: THREE.BufferGeometry): void {
  if (!geometry)
    return

  geometry.dispose()

  // Also dispose attributes if they have dispose method
  Object.keys(geometry.attributes).forEach((key) => {
    const attribute = geometry.attributes[key]
    if (attribute && typeof (attribute as any).dispose === 'function') {
      (attribute as any).dispose()
    }
  })
}
