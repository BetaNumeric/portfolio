<script setup lang="ts">
/// <reference types="vite/client" />
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter, withBase } from 'vitepress'
import * as THREE from 'three'
import { data as projectsData } from '../projects.data.mjs'

type FragmentResource = {
  buckets: FragmentBucketResource[]
  maxFragments: number
  texture: THREE.Texture
}

type FragmentBucketResource = {
  geometry: THREE.BufferGeometry
  matrices: THREE.Matrix4[]
  maxFragments: number
}

type FragmentMeshData = {
  projectIndex?: number
  bucketIndex?: number
  maxFragments?: number
  drawCount?: number
  physics?: FragmentPhysicsState
}

type FragmentPhysicsState = {
  basePositions: Float32Array
  currentPositions: Float32Array
  velocities: Float32Array
  quaternions: THREE.Quaternion[]
  inverseQuaternions: THREE.Quaternion[]
  scales: THREE.Vector3[]
  randoms: Float32Array
  spinAngles: Float32Array
  spinVelocities: Float32Array
  spinDirections: Float32Array
}

type FragmentSpan = {
  width: number
  height: number
  weight: number
}

const allProjects = projectsData.filter((project) => project.image && !project.link.includes('_template'))
const PROJECT_LIMIT = 11
const projects = allProjects.slice(0, PROJECT_LIMIT)

const canvasHost = ref<HTMLDivElement | null>(null)
const activeProjectIndex = ref(0)
const isDragging = ref(false)
const webglReady = ref(false)
const showDebug = import.meta.env.MODE === 'development'
const debugInfo = ref({
  fps: 0,
  visibleFragments: 0,
  totalFragments: 0,
})

const activeProject = computed(() => {
  return projects[activeProjectIndex.value] ?? projects[0]
})

const router = useRouter()
const chevronIcon = withBase('/assets/icons/chevron_b.svg')

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
const fragmentMeshes: Array<THREE.InstancedMesh | null> = []
const fragmentTextures: Array<THREE.Texture | null> = []
const fragmentAccumMaterials: Array<THREE.ShaderMaterial | null> = []
const fragmentRevealMaterials: Array<THREE.ShaderMaterial | null> = []
let accumRenderTarget: THREE.WebGLRenderTarget | null = null
let revealRenderTarget: THREE.WebGLRenderTarget | null = null
let compositeScene: THREE.Scene | null = null
let compositeCamera: THREE.OrthographicCamera | null = null
let compositeMaterial: THREE.ShaderMaterial | null = null
let compositeQuad: THREE.Mesh<THREE.PlaneGeometry, THREE.ShaderMaterial> | null = null
let animationFrame: number | null = null
let resizeObserver: ResizeObserver | null = null
let disposed = false
let lastFrameTime = 0
let perfSampleStartTime = 0
let perfSampleFrameCount = 0
let totalFragmentCount = 0

const fragmentGroup = new THREE.Group()
const projectAxes: THREE.Vector3[] = []
const worldYAxis = new THREE.Vector3(0, 1, 0)

const tempQuaternion = new THREE.Quaternion()
const tempViewDirection = new THREE.Vector3()
const tempCameraDirection = new THREE.Vector3()
const tempBasis = new THREE.Matrix4()
const tempPosition = new THREE.Vector3()
const tempScale = new THREE.Vector3()
const tempAxisX = new THREE.Vector3()
const tempMatrix = new THREE.Matrix4()
const tempRenderSize = new THREE.Vector2()
const tempGroupQuaternion = new THREE.Quaternion()
const tempPlaneNormal = new THREE.Vector3()
const tempGroupWorldPosition = new THREE.Vector3()
const tempHoverWorld = new THREE.Vector3()
const tempHoverLocal = new THREE.Vector3()
const tempHoverRayOrigin = new THREE.Vector3()
const tempHoverRayTarget = new THREE.Vector3()
const tempHoverRayDirection = new THREE.Vector3()
const tempHoverClosest = new THREE.Vector3()
const tempHoverRadial = new THREE.Vector3()
const tempHoverSwirl = new THREE.Vector3()
const tempSpinAxis = new THREE.Vector3()
const tempSpinQuaternion = new THREE.Quaternion()
const tempComposedQuaternion = new THREE.Quaternion()
const tempSpinEuler = new THREE.Euler()
const tempLocalViewAxis = new THREE.Vector3()
const projectAlignmentScores: number[] = []
const softClosestWeights: number[] = new Array(projects.length).fill(0)
const hoverRaycaster = new THREE.Raycaster()
const hoverInteractionPlane = new THREE.Plane()

const rotation = { y: 0 }
const targetRotation = { y: 0 }
const rotationX = { value: 0 }
const targetRotationX = { value: 0 }

const hoverPointerState = {
  inside: false,
  hasLocalPoint: false,
  lastMoveAt: 0,
  ndc: new THREE.Vector2(-100, -100),
  localPoint: new THREE.Vector3(),
  prevLocalPoint: new THREE.Vector3(),
  localVelocity: new THREE.Vector3(),
  interactionRadius: 0.01,
  spinDirection: 1,
  targetView: new THREE.Vector2(),
  currentView: new THREE.Vector2(),
  strength: 0,
}

const pointerState = {
  isDown: false,
  startX: 0,
  startY: 0,
  startRotY: 0,
  startRotX: 0,
  lastMoveAt: 0,
}

const VIEW_HEIGHT = 100
const IMAGE_PLANE_HEIGHT = 77
const NORMALIZED_IMAGE_ASPECT = 16 / 9
const IMAGE_PLANE_WIDTH = IMAGE_PLANE_HEIGHT * NORMALIZED_IMAGE_ASPECT
const DEPTH_SPREAD = 92
const TEXTURE_BASE_WIDTH = 864
const FRAGMENT_GRID_COLUMNS = 32
const FRAGMENT_GRID_ROWS = 24
const FRAGMENT_RENDER_BUCKETS = 6
const FRAGMENT_GAP_MIN = 1
const FRAGMENT_GAP_MAX = 1
const FRAGMENT_FLOAT_AMPLITUDE = 7.2
const FRAGMENT_FLOAT_SPEED = 0.36
const FRAGMENT_SPIN_SCALE = 1
const ROTATION_LERP = 0.1
const ROTATION_DRAG_FACTOR = 0.001
const ROTATION_X_LERP = 0.12
const ROTATION_X_MAX = THREE.MathUtils.degToRad(55)
const ROTATION_X_DRAG_THRESHOLD_PX = 100
const IDLE_PROJECT_ADVANCE_DELAY_MS = 7000
const HOVER_MOVE_THRESHOLD = 0.02
const HOVER_RADIUS_MIN = 5
const HOVER_RADIUS_MAX = 18
const HOVER_RADIUS_SPEED_SCALE = 3.4
const HOVER_PHYSICS_BASE_SPRING = 0.004
const HOVER_PHYSICS_SNAP_FORCE = 0.028
const HOVER_PHYSICS_SHARPNESS = 0.08
const HOVER_PHYSICS_DAMPING = 0.9
const HOVER_PHYSICS_ACTIVE_DAMPING = 0.84
const HOVER_PHYSICS_VELOCITY_FORCE = 0.22
const HOVER_PHYSICS_SWIRL_FORCE = 0.08
const HOVER_PHYSICS_RADIAL_FORCE = 0.04
const HOVER_SPIN_IMPULSE = 0.0055
const HOVER_SPIN_INTERACT_DAMPING = 0.82
const HOVER_SPIN_RETURN_DAMPING = 0.72
const HOVER_SPIN_RETURN_SPRING = 0.02
const HOVER_SPIN_MAX_SPEED = 0.045
const HOVER_SPIN_RETURN_CAP_SCALE = 0.035
const HOVER_SPIN_SETTLE_ANGLE = THREE.MathUtils.degToRad(1.2)
const HOVER_SPIN_SETTLE_SPEED = 0.0025
const HOVER_INFLUENCE_RADIUS = 18
const HOVER_PUSH_DISTANCE = 7
const HOVER_POINTER_LERP = 0.22
const HOVER_STRENGTH_LERP = 0.18
const HOVER_RETURN_MS = 260
const AUTO_ROTATE_SPEED = 0
const FRAGMENT_OPACITY_MIN = 0.10
const FRAGMENT_OPACITY_MAX = 0.98
const FRAGMENT_OPACITY_ALIGNMENT_EXP = 2.8
const FALLOFF_TO_MIN_AXIS_FRACTION = 0.8
const VISUAL_FALLOFF_MULTIPLIER = 2
const VISUAL_ALIGNMENT_BUFFER_AXIS_FRACTION = 0.1
const VISUAL_ALIGNMENT_BUFFER_MIN_ANGLE = THREE.MathUtils.degToRad(2)
const VISUAL_ALIGNMENT_BUFFER_MAX_ANGLE = THREE.MathUtils.degToRad(6)
const LOD_ALIGNMENT_BUFFER_AXIS_FRACTION = 0.4
const LOD_ALIGNMENT_BUFFER_MIN_ANGLE = THREE.MathUtils.degToRad(8)
const LOD_ALIGNMENT_BUFFER_MAX_ANGLE = THREE.MathUtils.degToRad(18)
const FRAGMENT_LOD_MIN_FRACTION = 0.3
const FRAGMENT_LOD_ALIGNMENT_EXP = 2.7
const FRAGMENT_LOD_FALLOFF_ANGLE = THREE.MathUtils.degToRad(90)
const CLOSEST_PROJECT_LOCK_EXP = 1.6
const CLOSEST_PROJECT_SOFT_SELECTION = 20
const SNAP_ANGLE_THRESHOLD = THREE.MathUtils.degToRad(20)
const SNAP_PULL = 0.22
const SNAP_SETTLE_THRESHOLD = THREE.MathUtils.degToRad(0.25)
const NAVBAR_CONTENT_WIDTH_FALLBACK_PX = 860
const PERFORMANCE_SAMPLE_MS = 600
const TAU = Math.PI * 2
const FRAGMENT_SPAN_OPTIONS: FragmentSpan[] = [
  { width: 1, height: 1, weight: 0.7 },
  { width: 2, height: 1, weight: 1 },
  { width: 1, height: 2, weight: 1 },
  { width: 2, height: 2, weight: 0.8 },
  { width: 3, height: 1, weight: 0.34 },
  { width: 1, height: 3, weight: 0.34 },
  { width: 3, height: 2, weight: 0.16 },
  { width: 2, height: 3, weight: 0.16 },
]

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

const randomBetween = (random: () => number, min: number, max: number) => {
  return min + (max - min) * random()
}

const hashString = (value: string) => {
  let hash = 2166136261
  for (let index = 0; index < value.length; index += 1) {
    hash ^= value.charCodeAt(index)
    hash = Math.imul(hash, 16777619)
  }
  return hash >>> 0
}

const createSeededRandom = (seed: number) => {
  let state = seed >>> 0
  return () => {
    state += 0x6d2b79f5
    let result = Math.imul(state ^ (state >>> 15), 1 | state)
    result ^= result + Math.imul(result ^ (result >>> 7), 61 | result)
    return ((result ^ (result >>> 14)) >>> 0) / 4294967296
  }
}

const createRandomUnitVector = (random: () => number, zBias = 1) => {
  let x = randomBetween(random, -1, 1)
  let y = randomBetween(random, -1, 1)
  let z = randomBetween(random, -1, 1) * zBias
  const length = Math.hypot(x, y, z) || 1
  x /= length
  y /= length
  z /= length
  return [x, y, z] as const
}

const proximityWithBuffer = (angle: number, falloffAngle: number, bufferAngle: number) => {
  const safeFalloff = Math.max(falloffAngle, 0.0001)
  const safeBuffer = clamp(bufferAngle, 0, Math.max(safeFalloff - 0.0001, 0))
  if (angle <= safeBuffer) return 1

  const normalized = clamp((angle - safeBuffer) / Math.max(safeFalloff - safeBuffer, 0.0001), 0, 1)
  return 1 - normalized
}

const getTargetNavbarContentWidthPx = () => {
  if (typeof document === 'undefined') return NAVBAR_CONTENT_WIDTH_FALLBACK_PX

  const navbarContent = document.querySelector('.site-header__wrapper') as HTMLElement | null
  if (navbarContent) {
    const measuredWidth = navbarContent.getBoundingClientRect().width
    if (measuredWidth > 0) return measuredWidth
  }

  const rootStyles = getComputedStyle(document.documentElement)
  const rawMaxWidth = rootStyles.getPropertyValue('--content-max-width').trim()
  const parsedMaxWidth = Number.parseFloat(rawMaxWidth)
  if (Number.isFinite(parsedMaxWidth) && parsedMaxWidth > 0) {
    return parsedMaxWidth
  }

  const legacyRawMaxWidth = rootStyles.getPropertyValue('--project-card-max-width').trim()
  const legacyParsedMaxWidth = Number.parseFloat(legacyRawMaxWidth)
  if (Number.isFinite(legacyParsedMaxWidth) && legacyParsedMaxWidth > 0) {
    return legacyParsedMaxWidth
  }

  return NAVBAR_CONTENT_WIDTH_FALLBACK_PX
}

const normalizeAngle = (angle: number) => {
  return Math.atan2(Math.sin(angle), Math.cos(angle))
}

const angleDelta = (from: number, to: number) => {
  return normalizeAngle(to - from)
}

const getNearestSnapTarget = (currentYaw: number) => {
  let nearestYaw = currentYaw
  let nearestDelta = Number.POSITIVE_INFINITY

  for (let index = 0; index < projectAxes.length; index += 1) {
    const axis = projectAxes[index]
    const axisAngle = Math.atan2(axis.x, axis.z)
    const candidates = [-axisAngle, -(axisAngle + Math.PI)]

    for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
      const candidateYaw = candidates[candidateIndex]
      const delta = angleDelta(currentYaw, candidateYaw)
      if (Math.abs(delta) < Math.abs(nearestDelta)) {
        nearestDelta = delta
        nearestYaw = currentYaw + delta
      }
    }
  }

  return { yaw: nearestYaw, delta: nearestDelta }
}

const getProjectYawCandidates = (projectIndex: number) => {
  const axis = projectAxes[projectIndex]
  if (!axis) return [] as number[]

  const axisAngle = Math.atan2(axis.x, axis.z)
  return [-axisAngle, -(axisAngle + Math.PI)]
}

const getAdjacentProjectYaw = (angularDirection: number, fromYaw: number) => {
  if (!projectAxes.length) return null

  const fullTurn = Math.PI * 2
  const epsilon = 0.0001
  const referenceYaw = getNearestSnapTarget(fromYaw).yaw

  let bestYaw = angularDirection > 0 ? Number.POSITIVE_INFINITY : Number.NEGATIVE_INFINITY

  for (let projectIndex = 0; projectIndex < projectAxes.length; projectIndex += 1) {
    const candidates = getProjectYawCandidates(projectIndex)

    for (let candidateIndex = 0; candidateIndex < candidates.length; candidateIndex += 1) {
      const nearestYaw = referenceYaw + angleDelta(referenceYaw, candidates[candidateIndex])
      const variants = [nearestYaw - fullTurn, nearestYaw, nearestYaw + fullTurn]

      for (let variantIndex = 0; variantIndex < variants.length; variantIndex += 1) {
        const candidateYaw = variants[variantIndex]

        if (angularDirection > 0) {
          if (candidateYaw > referenceYaw + epsilon && candidateYaw < bestYaw) {
            bestYaw = candidateYaw
          }
        } else if (angularDirection < 0) {
          if (candidateYaw < referenceYaw - epsilon && candidateYaw > bestYaw) {
            bestYaw = candidateYaw
          }
        }
      }
    }
  }

  return Number.isFinite(bestYaw) ? bestYaw : null
}

const goToProjectIndex = (projectIndex: number) => {
  if (!projectAxes.length) return

  const normalizedIndex = ((projectIndex % projectAxes.length) + projectAxes.length) % projectAxes.length
  const candidates = getProjectYawCandidates(normalizedIndex)
  if (!candidates.length) return

  let nearestYaw = candidates[0]
  let nearestDelta = angleDelta(targetRotation.y, candidates[0])

  for (let index = 1; index < candidates.length; index += 1) {
    const delta = angleDelta(targetRotation.y, candidates[index])
    if (Math.abs(delta) < Math.abs(nearestDelta)) {
      nearestDelta = delta
      nearestYaw = targetRotation.y + delta
    }
  }

  targetRotation.y = nearestYaw
  targetRotationX.value = 0
  pointerState.lastMoveAt = performance.now()
}

const rotateToRelativeProject = (direction: number) => {
  if (!projectAxes.length) return

  const angularDirection = direction > 0 ? -1 : 1
  const nextYaw = getAdjacentProjectYaw(angularDirection, targetRotation.y)
  if (nextYaw === null) return

  targetRotation.y = nextYaw
  targetRotationX.value = 0
  pointerState.lastMoveAt = performance.now()
}

const goToPreviousProject = () => {
  rotateToRelativeProject(-1)
}

const goToNextProject = () => {
  rotateToRelativeProject(1)
}

const goToProject = (link: string) => {
  if (!link) return
  try {
    if (router && typeof (router as any).push === 'function') {
      ;(router as any).push(link)
      return
    }
  } catch {
    // Fall through to full navigation.
  }
  window.location.href = withBase(link)
}

const openActiveProject = () => {
  if (!activeProject.value) return
  goToProject(activeProject.value.link)
}

const loadImage = (url: string) => {
  return new Promise<HTMLImageElement>((resolve, reject) => {
    const image = new Image()
    image.decoding = 'async'
    image.onload = () => resolve(image)
    image.onerror = () => reject(new Error(`Failed to load image: ${url}`))
    image.src = url
  })
}

const setupProjectAxes = () => {
  projectAxes.length = 0
  projectAlignmentScores.length = projects.length

  if (!projects.length) return

  const axisStep = Math.PI / projects.length
  for (let index = 0; index < projects.length; index += 1) {
    const angle = axisStep * index
    projectAxes[index] = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).normalize()
    projectAlignmentScores[index] = 0
  }
}

const buildTextureCanvas = (image: HTMLImageElement) => {
  const textureWidth = TEXTURE_BASE_WIDTH
  const textureHeight = Math.round(TEXTURE_BASE_WIDTH / NORMALIZED_IMAGE_ASPECT)
  const sourceAspect = image.naturalWidth / image.naturalHeight

  let sourceX = 0
  let sourceY = 0
  let sourceWidth = image.naturalWidth
  let sourceHeight = image.naturalHeight

  if (sourceAspect > NORMALIZED_IMAGE_ASPECT) {
    sourceWidth = image.naturalHeight * NORMALIZED_IMAGE_ASPECT
    sourceX = (image.naturalWidth - sourceWidth) * 0.5
  } else if (sourceAspect < NORMALIZED_IMAGE_ASPECT) {
    sourceHeight = image.naturalWidth / NORMALIZED_IMAGE_ASPECT
    sourceY = (image.naturalHeight - sourceHeight) * 0.5
  }

  const canvas = document.createElement('canvas')
  canvas.width = textureWidth
  canvas.height = textureHeight

  const ctx = canvas.getContext('2d')
  if (!ctx) return null

  ctx.drawImage(
    image,
    sourceX,
    sourceY,
    sourceWidth,
    sourceHeight,
    0,
    0,
    textureWidth,
    textureHeight
  )

  return { canvas, textureWidth, textureHeight }
}

const isSpanAvailable = (
  occupied: boolean[],
  startX: number,
  startY: number,
  width: number,
  height: number
) => {
  if (startX + width > FRAGMENT_GRID_COLUMNS || startY + height > FRAGMENT_GRID_ROWS) return false

  for (let y = startY; y < startY + height; y += 1) {
    for (let x = startX; x < startX + width; x += 1) {
      if (occupied[y * FRAGMENT_GRID_COLUMNS + x]) return false
    }
  }

  return true
}

const fillSpan = (
  occupied: boolean[],
  startX: number,
  startY: number,
  width: number,
  height: number
) => {
  for (let y = startY; y < startY + height; y += 1) {
    for (let x = startX; x < startX + width; x += 1) {
      occupied[y * FRAGMENT_GRID_COLUMNS + x] = true
    }
  }
}

const pickFragmentSpan = (random: () => number, occupied: boolean[], startX: number, startY: number) => {
  const validOptions = FRAGMENT_SPAN_OPTIONS.filter((option) => {
    return isSpanAvailable(occupied, startX, startY, option.width, option.height)
  })

  const options = validOptions.length ? validOptions : [{ width: 1, height: 1, weight: 1 }]
  const totalWeight = options.reduce((sum, option) => sum + option.weight, 0)
  let target = random() * totalWeight

  for (let index = 0; index < options.length; index += 1) {
    target -= options[index].weight
    if (target <= 0) return options[index]
  }

  return options[options.length - 1]
}

const createCornerCuts = (_random: () => number, _spanWidth: number, _spanHeight: number) => {
  return [0, 0, 0, 0] as const
}

const shuffleIndices = (random: () => number, count: number) => {
  const indices = Array.from({ length: count }, (_, index) => index)

  for (let index = count - 1; index > 0; index -= 1) {
    const swapIndex = Math.floor(random() * (index + 1))
    const temp = indices[index]
    indices[index] = indices[swapIndex]
    indices[swapIndex] = temp
  }

  return indices
}

const buildFragmentBucket = (
  matrices: THREE.Matrix4[],
  instanceUvRect: number[],
  motionDirs: number[],
  spinAxes: number[],
  motionPhases: number[],
  spinAmounts: number[],
  cornerCuts: number[],
  indices: number[]
) => {
  const geometry = new THREE.PlaneGeometry(1, 1, 1, 1)
  const bucketMatrices: THREE.Matrix4[] = []
  const bucketUvRect: number[] = []
  const bucketMotionDirs: number[] = []
  const bucketSpinAxes: number[] = []
  const bucketMotionPhases: number[] = []
  const bucketSpinAmounts: number[] = []
  const bucketCornerCuts: number[] = []

  for (let index = 0; index < indices.length; index += 1) {
    const fragmentIndex = indices[index]
    const vec3Offset = fragmentIndex * 3
    const vec4Offset = fragmentIndex * 4

    bucketMatrices.push(matrices[fragmentIndex].clone())
    bucketUvRect.push(
      instanceUvRect[vec4Offset],
      instanceUvRect[vec4Offset + 1],
      instanceUvRect[vec4Offset + 2],
      instanceUvRect[vec4Offset + 3]
    )
    bucketMotionDirs.push(
      motionDirs[vec3Offset],
      motionDirs[vec3Offset + 1],
      motionDirs[vec3Offset + 2]
    )
    bucketSpinAxes.push(
      spinAxes[vec3Offset],
      spinAxes[vec3Offset + 1],
      spinAxes[vec3Offset + 2]
    )
    bucketMotionPhases.push(motionPhases[fragmentIndex])
    bucketSpinAmounts.push(spinAmounts[fragmentIndex])
    bucketCornerCuts.push(
      cornerCuts[vec4Offset],
      cornerCuts[vec4Offset + 1],
      cornerCuts[vec4Offset + 2],
      cornerCuts[vec4Offset + 3]
    )
  }

  geometry.setAttribute('instanceUvRect', new THREE.InstancedBufferAttribute(new Float32Array(bucketUvRect), 4))
  geometry.setAttribute('motionDir', new THREE.InstancedBufferAttribute(new Float32Array(bucketMotionDirs), 3))
  geometry.setAttribute('spinAxis', new THREE.InstancedBufferAttribute(new Float32Array(bucketSpinAxes), 3))
  geometry.setAttribute('motionPhase', new THREE.InstancedBufferAttribute(new Float32Array(bucketMotionPhases), 1))
  geometry.setAttribute('spinAmount', new THREE.InstancedBufferAttribute(new Float32Array(bucketSpinAmounts), 1))
  geometry.setAttribute('cornerCuts', new THREE.InstancedBufferAttribute(new Float32Array(bucketCornerCuts), 4))
  geometry.computeBoundingSphere()

  return {
    geometry,
    matrices: bucketMatrices,
    maxFragments: bucketMatrices.length,
  } satisfies FragmentBucketResource
}

const buildFragmentResource = async (projectIndex: number) => {
  const project = projects[projectIndex]
  const imageUrl = withBase(project.image)

  let image: HTMLImageElement | null = null
  try {
    image = await loadImage(imageUrl)
  } catch {
    return null
  }

  if (!image.naturalWidth || !image.naturalHeight) return null

  const textureCanvas = buildTextureCanvas(image)
  if (!textureCanvas) return null

  const { canvas, textureWidth, textureHeight } = textureCanvas
  const texture = new THREE.CanvasTexture(canvas)
  texture.colorSpace = THREE.SRGBColorSpace
  texture.wrapS = THREE.ClampToEdgeWrapping
  texture.wrapT = THREE.ClampToEdgeWrapping
  texture.minFilter = THREE.LinearMipmapLinearFilter
  texture.magFilter = THREE.LinearFilter
  texture.generateMipmaps = true

  const random = createSeededRandom(hashString(`${project.title}:${project.link}:${projectIndex}`))
  const occupied = new Array(FRAGMENT_GRID_COLUMNS * FRAGMENT_GRID_ROWS).fill(false)
  const geometry = new THREE.PlaneGeometry(1, 1, 1, 1)
  const axis = projectAxes[projectIndex]
  const planeAxis = tempAxisX.set(axis.z, 0, -axis.x).normalize().clone()
  const cellWidth = IMAGE_PLANE_WIDTH / FRAGMENT_GRID_COLUMNS
  const cellHeight = IMAGE_PLANE_HEIGHT / FRAGMENT_GRID_ROWS
  const insetU = 0
  const insetV = 0

  const matrices: THREE.Matrix4[] = []
  const instanceUvRect: number[] = []
  const motionDirs: number[] = []
  const spinAxes: number[] = []
  const motionPhases: number[] = []
  const spinAmounts: number[] = []
  const cornerCuts: number[] = []

  tempBasis.makeBasis(planeAxis, worldYAxis, axis)
  tempQuaternion.setFromRotationMatrix(tempBasis)

  for (let y = 0; y < FRAGMENT_GRID_ROWS; y += 1) {
    for (let x = 0; x < FRAGMENT_GRID_COLUMNS; x += 1) {
      if (occupied[y * FRAGMENT_GRID_COLUMNS + x]) continue

      const span = pickFragmentSpan(random, occupied, x, y)
      fillSpan(occupied, x, y, span.width, span.height)

      const gapScale = randomBetween(random, FRAGMENT_GAP_MIN, FRAGMENT_GAP_MAX)
      const fragmentWidth = Math.max(cellWidth * 0.72, cellWidth * span.width * gapScale)
      const fragmentHeight = Math.max(cellHeight * 0.72, cellHeight * span.height * gapScale)
      const centerX = ((x + span.width * 0.5) / FRAGMENT_GRID_COLUMNS - 0.5) * IMAGE_PLANE_WIDTH
      const centerY = (0.5 - (y + span.height * 0.5) / FRAGMENT_GRID_ROWS) * IMAGE_PLANE_HEIGHT
      const depthOffset = randomBetween(random, -DEPTH_SPREAD, DEPTH_SPREAD)

      tempPosition.copy(planeAxis).multiplyScalar(centerX)
      tempPosition.y = centerY
      tempPosition.addScaledVector(axis, depthOffset)
      tempScale.set(fragmentWidth, fragmentHeight, 1)
      tempMatrix.compose(tempPosition, tempQuaternion, tempScale)
      matrices.push(tempMatrix.clone())

      const uOffset = x / FRAGMENT_GRID_COLUMNS + insetU
      const uScale = Math.max(span.width / FRAGMENT_GRID_COLUMNS - insetU * 2, 0.0001)
      const vOffset = 1 - (y + span.height) / FRAGMENT_GRID_ROWS + insetV
      const vScale = Math.max(span.height / FRAGMENT_GRID_ROWS - insetV * 2, 0.0001)
      instanceUvRect.push(uOffset, vOffset, uScale, vScale)

      const motionDir = createRandomUnitVector(random, 1.35)
      motionDirs.push(motionDir[0], motionDir[1], motionDir[2])

      const spinAxis = createRandomUnitVector(random, 1.6)
      spinAxes.push(spinAxis[0], spinAxis[1], spinAxis[2])

      motionPhases.push(random() * TAU)
      spinAmounts.push(randomBetween(random, THREE.MathUtils.degToRad(10), THREE.MathUtils.degToRad(42)))

      const cuts = createCornerCuts(random, span.width, span.height)
      cornerCuts.push(cuts[0], cuts[1], cuts[2], cuts[3])
    }
  }

  if (!matrices.length) {
    geometry.dispose()
    texture.dispose()
    return null
  }

  geometry.dispose()

  const shuffledIndices = shuffleIndices(random, matrices.length)
  const bucketCount = Math.min(FRAGMENT_RENDER_BUCKETS, matrices.length)
  const bucketIndices = Array.from({ length: bucketCount }, () => [] as number[])

  for (let index = 0; index < shuffledIndices.length; index += 1) {
    bucketIndices[index % bucketCount].push(shuffledIndices[index])
  }

  const buckets = bucketIndices
    .filter((indices) => indices.length > 0)
    .map((indices) => {
      return buildFragmentBucket(
        matrices,
        instanceUvRect,
        motionDirs,
        spinAxes,
        motionPhases,
        spinAmounts,
        cornerCuts,
        indices
      )
    })

  return {
    buckets,
    maxFragments: matrices.length,
    texture,
  } satisfies FragmentResource
}

const buildFragmentResources = async () => {
  setupProjectAxes()
  return Promise.all(projects.map((_, index) => buildFragmentResource(index)))
}

const updateHoverPointerFromEvent = (event: PointerEvent) => {
  if (!canvasHost.value || !camera || pointerState.isDown) return

  const rect = canvasHost.value.getBoundingClientRect()
  if (rect.width <= 0 || rect.height <= 0) return

  const normalizedX = clamp((event.clientX - rect.left) / rect.width, 0, 1)
  const normalizedY = clamp((event.clientY - rect.top) / rect.height, 0, 1)
  hoverPointerState.ndc.set(normalizedX * 2 - 1, -(normalizedY * 2 - 1))
  hoverPointerState.inside = true
  hoverPointerState.lastMoveAt = performance.now()
}

const clearHoverPointer = () => {
  hoverPointerState.inside = false
  hoverPointerState.hasLocalPoint = false
  hoverPointerState.localVelocity.set(0, 0, 0)
  hoverPointerState.interactionRadius = 0.01
  hoverPointerState.spinDirection = 1
}

const updateFragmentHoverPhysics = () => {
  if (!camera) return

  hoverPointerState.localVelocity.set(0, 0, 0)
  let hasInteractionRay = false

  if (hoverPointerState.inside && !pointerState.isDown) {
    hoverRaycaster.setFromCamera(hoverPointerState.ndc, camera)
    camera.getWorldDirection(tempPlaneNormal).normalize()
    fragmentGroup.getWorldPosition(tempGroupWorldPosition)
    hoverInteractionPlane.setFromNormalAndCoplanarPoint(tempPlaneNormal, tempGroupWorldPosition)

    tempHoverRayOrigin.copy(hoverRaycaster.ray.origin)
    tempHoverRayTarget.copy(hoverRaycaster.ray.origin).add(hoverRaycaster.ray.direction)
    fragmentGroup.worldToLocal(tempHoverRayOrigin)
    fragmentGroup.worldToLocal(tempHoverRayTarget)
    tempHoverRayDirection.copy(tempHoverRayTarget).sub(tempHoverRayOrigin).normalize()
    hasInteractionRay = true

    if (hoverRaycaster.ray.intersectPlane(hoverInteractionPlane, tempHoverWorld)) {
      tempHoverLocal.copy(tempHoverWorld)
      fragmentGroup.worldToLocal(tempHoverLocal)

      if (!hoverPointerState.hasLocalPoint) {
        hoverPointerState.prevLocalPoint.copy(tempHoverLocal)
        hoverPointerState.localPoint.copy(tempHoverLocal)
        hoverPointerState.hasLocalPoint = true
      } else {
        hoverPointerState.localVelocity.copy(tempHoverLocal).sub(hoverPointerState.prevLocalPoint)
        hoverPointerState.prevLocalPoint.copy(tempHoverLocal)
        hoverPointerState.localPoint.copy(tempHoverLocal)
      }
    }
  }

  const hoverAge = performance.now() - hoverPointerState.lastMoveAt
  const mouseSpeed = hoverPointerState.localVelocity.length()
  const isMoving =
    hoverPointerState.inside &&
    !pointerState.isDown &&
    hoverPointerState.hasLocalPoint &&
    mouseSpeed > HOVER_MOVE_THRESHOLD

  if (isMoving) {
    const spinSource =
      Math.abs(hoverPointerState.localVelocity.x) >= Math.abs(hoverPointerState.localVelocity.y)
        ? hoverPointerState.localVelocity.x
        : hoverPointerState.localVelocity.y

    if (Math.abs(spinSource) > 0.0001) {
      hoverPointerState.spinDirection = Math.sign(spinSource) || hoverPointerState.spinDirection
    }
  }

  let targetRadius = 0.01
  if (isMoving) {
    targetRadius = clamp(
      Math.max(mouseSpeed * HOVER_RADIUS_SPEED_SCALE, HOVER_RADIUS_MIN),
      HOVER_RADIUS_MIN,
      HOVER_RADIUS_MAX
    )
  }

  hoverPointerState.interactionRadius += (targetRadius - hoverPointerState.interactionRadius) * 0.24
  const isInteracting =
    hoverPointerState.hasLocalPoint &&
    !pointerState.isDown &&
    hoverAge < HOVER_RETURN_MS &&
    hoverPointerState.interactionRadius > 0.05
  const interactionRadius = isInteracting ? hoverPointerState.interactionRadius : 0.01
  const interactionRadiusSq = interactionRadius * interactionRadius

  if (hasInteractionRay) {
    tempLocalViewAxis.copy(tempHoverRayDirection)
  } else {
    camera.getWorldDirection(tempPlaneNormal).normalize()
    fragmentGroup.getWorldQuaternion(tempGroupQuaternion)
    tempLocalViewAxis.copy(tempPlaneNormal).applyQuaternion(tempGroupQuaternion.invert()).normalize()
  }

  for (let meshIndex = 0; meshIndex < fragmentMeshes.length; meshIndex += 1) {
    const mesh = fragmentMeshes[meshIndex]
    if (!mesh) continue

    const meshData = mesh.userData as FragmentMeshData
    const physics = meshData.physics
    if (!physics) continue

    const isActiveProject = (meshData.projectIndex ?? 0) === activeProjectIndex.value
    let needsMatrixUpdate = false

    for (let fragmentIndex = 0; fragmentIndex < mesh.count; fragmentIndex += 1) {
      const offset = fragmentIndex * 3
      let px = physics.currentPositions[offset]
      let py = physics.currentPositions[offset + 1]
      let pz = physics.currentPositions[offset + 2]
      let vx = physics.velocities[offset]
      let vy = physics.velocities[offset + 1]
      let vz = physics.velocities[offset + 2]
      let spinAngleX = physics.spinAngles[offset]
      let spinAngleY = physics.spinAngles[offset + 1]
      let spinAngleZ = physics.spinAngles[offset + 2]
      let spinVelocityX = physics.spinVelocities[offset]
      let spinVelocityY = physics.spinVelocities[offset + 1]
      let spinVelocityZ = physics.spinVelocities[offset + 2]
      const ox = physics.basePositions[offset]
      const oy = physics.basePositions[offset + 1]
      const oz = physics.basePositions[offset + 2]
      const random = physics.randoms[fragmentIndex]
      let spinWasInteracted = false

      const dx = ox - px
      const dy = oy - py
      const dz = oz - pz
      const distSq = dx * dx + dy * dy + dz * dz
      const proximity = 1 / (1 + distSq * HOVER_PHYSICS_SHARPNESS)
      const springK =
        HOVER_PHYSICS_BASE_SPRING * (0.6 + random * 0.8) +
        HOVER_PHYSICS_SNAP_FORCE * proximity * proximity * proximity

      vx += dx * springK
      vy += dy * springK
      vz += dz * springK

      if (!isActiveProject && isInteracting && hasInteractionRay) {
        tempHoverRadial.set(px, py, pz).sub(tempHoverRayOrigin)
        const rayDepth = tempHoverRadial.dot(tempHoverRayDirection)

        if (rayDepth >= 0) {
          tempHoverClosest.copy(tempHoverRayDirection).multiplyScalar(rayDepth).add(tempHoverRayOrigin)
          tempHoverRadial.set(px, py, pz).sub(tempHoverClosest)
          const mouseDistSq = tempHoverRadial.lengthSq()

          if (mouseDistSq < interactionRadiusSq) {
            const dist = Math.sqrt(Math.max(mouseDistSq, 0.000001))
            const influence = 1 - mouseDistSq / interactionRadiusSq
            const force = HOVER_PHYSICS_VELOCITY_FORCE * (0.8 + random * 0.4)

            vx += hoverPointerState.localVelocity.x * force * influence
            vy += hoverPointerState.localVelocity.y * force * influence
            vz += hoverPointerState.localVelocity.z * force * influence

            const swirl = HOVER_PHYSICS_SWIRL_FORCE * (0.5 + random) * influence
            tempHoverSwirl.copy(tempLocalViewAxis).cross(tempHoverRadial)
            const swirlLength = tempHoverSwirl.length()
            if (swirlLength > 0.0001) {
              tempHoverSwirl.multiplyScalar(swirl / swirlLength)
              vx += tempHoverSwirl.x
              vy += tempHoverSwirl.y
              vz += tempHoverSwirl.z
            }

            const radialScale = (HOVER_PHYSICS_RADIAL_FORCE * force * influence) / dist
            vx += tempHoverRadial.x * radialScale
            vy += tempHoverRadial.y * radialScale
            vz += tempHoverRadial.z * radialScale

            tempSpinAxis
              .copy(hoverPointerState.localVelocity)
              .cross(tempLocalViewAxis)
            tempSpinAxis.applyQuaternion(physics.inverseQuaternions[fragmentIndex])

            const spinAxisLength = tempSpinAxis.length()
            if (spinAxisLength > 0.0001) {
              const clampedMouseSpeed = Math.min(mouseSpeed, 0.9)
              const spinImpulse =
                clampedMouseSpeed *
                HOVER_SPIN_IMPULSE *
                influence *
                (0.75 + random * 0.35)
              tempSpinAxis.multiplyScalar(spinImpulse / spinAxisLength)
              spinVelocityX += tempSpinAxis.x
              spinVelocityY += tempSpinAxis.y
              spinVelocityZ += tempSpinAxis.z

              if (Math.abs(tempSpinAxis.x) > 0.00001) {
                physics.spinDirections[offset] = Math.sign(tempSpinAxis.x) || physics.spinDirections[offset] || 1
              }
              if (Math.abs(tempSpinAxis.y) > 0.00001) {
                physics.spinDirections[offset + 1] =
                  Math.sign(tempSpinAxis.y) || physics.spinDirections[offset + 1] || 1
              }
              if (Math.abs(tempSpinAxis.z) > 0.00001) {
                physics.spinDirections[offset + 2] =
                  Math.sign(tempSpinAxis.z) || physics.spinDirections[offset + 2] || 1
              }
            }

            spinWasInteracted = true
          }
        }
      }

      const damping = isActiveProject ? HOVER_PHYSICS_ACTIVE_DAMPING : HOVER_PHYSICS_DAMPING
      vx *= damping
      vy *= damping
      vz *= damping

      px += vx
      py += vy
      pz += vz

      if (spinWasInteracted) {
        spinVelocityX *= HOVER_SPIN_INTERACT_DAMPING
        spinVelocityY *= HOVER_SPIN_INTERACT_DAMPING
        spinVelocityZ *= HOVER_SPIN_INTERACT_DAMPING
        spinVelocityX = clamp(spinVelocityX, -HOVER_SPIN_MAX_SPEED, HOVER_SPIN_MAX_SPEED)
        spinVelocityY = clamp(spinVelocityY, -HOVER_SPIN_MAX_SPEED, HOVER_SPIN_MAX_SPEED)
        spinVelocityZ = clamp(spinVelocityZ, -HOVER_SPIN_MAX_SPEED, HOVER_SPIN_MAX_SPEED)
      } else {
        const spinDirectionX = physics.spinDirections[offset] || 1
        const spinDirectionY = physics.spinDirections[offset + 1] || 1
        const spinDirectionZ = physics.spinDirections[offset + 2] || 1
        const spinTargetX =
          spinDirectionX >= 0 ? Math.ceil((spinAngleX - 0.00001) / TAU) * TAU : Math.floor((spinAngleX + 0.00001) / TAU) * TAU
        const spinTargetY =
          spinDirectionY >= 0 ? Math.ceil((spinAngleY - 0.00001) / TAU) * TAU : Math.floor((spinAngleY + 0.00001) / TAU) * TAU
        const spinTargetZ =
          spinDirectionZ >= 0 ? Math.ceil((spinAngleZ - 0.00001) / TAU) * TAU : Math.floor((spinAngleZ + 0.00001) / TAU) * TAU

        spinVelocityX += (spinTargetX - spinAngleX) * HOVER_SPIN_RETURN_SPRING
        spinVelocityY += (spinTargetY - spinAngleY) * HOVER_SPIN_RETURN_SPRING
        spinVelocityZ += (spinTargetZ - spinAngleZ) * HOVER_SPIN_RETURN_SPRING
        spinVelocityX *= HOVER_SPIN_RETURN_DAMPING
        spinVelocityY *= HOVER_SPIN_RETURN_DAMPING
        spinVelocityZ *= HOVER_SPIN_RETURN_DAMPING

        const remainingX = Math.abs(spinTargetX - spinAngleX)
        const remainingY = Math.abs(spinTargetY - spinAngleY)
        const remainingZ = Math.abs(spinTargetZ - spinAngleZ)
        const returnCapX = Math.max(
          HOVER_SPIN_SETTLE_SPEED * 2,
          Math.min(HOVER_SPIN_MAX_SPEED, Math.sqrt(remainingX) * HOVER_SPIN_RETURN_CAP_SCALE)
        )
        const returnCapY = Math.max(
          HOVER_SPIN_SETTLE_SPEED * 2,
          Math.min(HOVER_SPIN_MAX_SPEED, Math.sqrt(remainingY) * HOVER_SPIN_RETURN_CAP_SCALE)
        )
        const returnCapZ = Math.max(
          HOVER_SPIN_SETTLE_SPEED * 2,
          Math.min(HOVER_SPIN_MAX_SPEED, Math.sqrt(remainingZ) * HOVER_SPIN_RETURN_CAP_SCALE)
        )

        spinVelocityX = clamp(spinVelocityX, -returnCapX, returnCapX)
        spinVelocityY = clamp(spinVelocityY, -returnCapY, returnCapY)
        spinVelocityZ = clamp(spinVelocityZ, -returnCapZ, returnCapZ)
      }

      spinAngleX += spinVelocityX
      spinAngleY += spinVelocityY
      spinAngleZ += spinVelocityZ

      if (!spinWasInteracted) {
        const settleDirectionX = physics.spinDirections[offset] || 1
        const settleDirectionY = physics.spinDirections[offset + 1] || 1
        const settleDirectionZ = physics.spinDirections[offset + 2] || 1
        const settleTargetX =
          settleDirectionX >= 0
            ? Math.ceil((spinAngleX - 0.00001) / TAU) * TAU
            : Math.floor((spinAngleX + 0.00001) / TAU) * TAU
        const settleTargetY =
          settleDirectionY >= 0
            ? Math.ceil((spinAngleY - 0.00001) / TAU) * TAU
            : Math.floor((spinAngleY + 0.00001) / TAU) * TAU
        const settleTargetZ =
          settleDirectionZ >= 0
            ? Math.ceil((spinAngleZ - 0.00001) / TAU) * TAU
            : Math.floor((spinAngleZ + 0.00001) / TAU) * TAU

        if (
          Math.abs(settleTargetX - spinAngleX) < HOVER_SPIN_SETTLE_ANGLE &&
          Math.abs(spinVelocityX) < HOVER_SPIN_SETTLE_SPEED
        ) {
          spinAngleX = 0
          spinVelocityX = 0
        }

        if (
          Math.abs(settleTargetY - spinAngleY) < HOVER_SPIN_SETTLE_ANGLE &&
          Math.abs(spinVelocityY) < HOVER_SPIN_SETTLE_SPEED
        ) {
          spinAngleY = 0
          spinVelocityY = 0
        }

        if (
          Math.abs(settleTargetZ - spinAngleZ) < HOVER_SPIN_SETTLE_ANGLE &&
          Math.abs(spinVelocityZ) < HOVER_SPIN_SETTLE_SPEED
        ) {
          spinAngleZ = 0
          spinVelocityZ = 0
        }
      }

      physics.currentPositions[offset] = px
      physics.currentPositions[offset + 1] = py
      physics.currentPositions[offset + 2] = pz
      physics.velocities[offset] = vx
      physics.velocities[offset + 1] = vy
      physics.velocities[offset + 2] = vz
      physics.spinAngles[offset] = spinAngleX
      physics.spinAngles[offset + 1] = spinAngleY
      physics.spinAngles[offset + 2] = spinAngleZ
      physics.spinVelocities[offset] = spinVelocityX
      physics.spinVelocities[offset + 1] = spinVelocityY
      physics.spinVelocities[offset + 2] = spinVelocityZ

      const changed =
        Math.abs(vx) > 0.0001 ||
        Math.abs(vy) > 0.0001 ||
        Math.abs(vz) > 0.0001 ||
        Math.abs(spinAngleX) > 0.0001 ||
        Math.abs(spinAngleY) > 0.0001 ||
        Math.abs(spinAngleZ) > 0.0001 ||
        Math.abs(spinVelocityX) > 0.0001 ||
        Math.abs(spinVelocityY) > 0.0001 ||
        Math.abs(spinVelocityZ) > 0.0001 ||
        Math.abs(px - ox) > 0.0001 ||
        Math.abs(py - oy) > 0.0001 ||
        Math.abs(pz - oz) > 0.0001

      if (changed) needsMatrixUpdate = true

      tempPosition.set(px, py, pz)
      tempSpinEuler.set(spinAngleX, spinAngleY, spinAngleZ, 'XYZ')
      tempSpinQuaternion.setFromEuler(tempSpinEuler)
      tempComposedQuaternion.copy(physics.quaternions[fragmentIndex]).multiply(tempSpinQuaternion)
      tempMatrix.compose(tempPosition, tempComposedQuaternion, physics.scales[fragmentIndex])
      mesh.setMatrixAt(fragmentIndex, tempMatrix)
    }

    if (needsMatrixUpdate) {
      mesh.instanceMatrix.needsUpdate = true
    }
  }
}

const fragmentVertexShader = `
attribute vec4 instanceUvRect;
attribute vec3 motionDir;
attribute vec3 spinAxis;
attribute float motionPhase;
attribute float spinAmount;
attribute vec4 cornerCuts;

uniform float uTime;
uniform float uMotion;
uniform float uFloatAmplitude;
uniform float uFloatSpeed;
uniform float uSpinScale;
uniform vec2 uHoverCursorView;
uniform float uHoverRadius;
uniform float uHoverPush;
uniform float uHoverStrength;
uniform float uHoverProjectMix;

varying vec2 vMapUv;
varying vec2 vPieceUv;
varying vec4 vCornerCuts;

mat3 rotation3d(vec3 axis, float angle) {
  axis = normalize(axis);
  float s = sin(angle);
  float c = cos(angle);
  float oc = 1.0 - c;

  return mat3(
    oc * axis.x * axis.x + c,
    oc * axis.x * axis.y - axis.z * s,
    oc * axis.z * axis.x + axis.y * s,
    oc * axis.x * axis.y + axis.z * s,
    oc * axis.y * axis.y + c,
    oc * axis.y * axis.z - axis.x * s,
    oc * axis.z * axis.x - axis.y * s,
    oc * axis.y * axis.z + axis.x * s,
    oc * axis.z * axis.z + c
  );
}

void main() {
  vec3 transformed = position;
  float motionTime = uTime * uFloatSpeed + motionPhase;
  float waveA = sin(motionTime);
  float waveB = cos((motionTime * 1.63) + (motionPhase * 0.57));
  vec3 drift = motionDir * (waveA + (waveB * 0.5)) * uFloatAmplitude * uMotion;
  float spinAngle = spinAmount * (0.58 + 0.42 * sin((motionTime * 0.81) + motionPhase)) * uMotion * uSpinScale;
  transformed = rotation3d(spinAxis, spinAngle) * transformed;
  transformed += drift;

  vec4 worldPosition = vec4(transformed, 1.0);
  #ifdef USE_INSTANCING
    worldPosition = instanceMatrix * worldPosition;
  #endif

  vec4 mvPosition = modelViewMatrix * worldPosition;
  vec2 hoverOffset = mvPosition.xy - uHoverCursorView;
  float hoverDistance = length(hoverOffset);
  float hoverInfluence =
    uHoverProjectMix *
    uHoverStrength *
    (1.0 - smoothstep(uHoverRadius * 0.2, uHoverRadius, hoverDistance));
  vec2 hoverDirection = hoverDistance > 0.0001
    ? hoverOffset / hoverDistance
    : normalize(motionDir.xy + vec2(0.0001, 0.0));
  mvPosition.xy += hoverDirection * hoverInfluence * uHoverPush;
  gl_Position = projectionMatrix * mvPosition;

  vMapUv = uv * instanceUvRect.zw + instanceUvRect.xy;
  vPieceUv = uv;
  vCornerCuts = cornerCuts;
}
`

const fragmentShaderCommon = `
uniform sampler2D uMap;
uniform float uOpacity;

varying vec2 vMapUv;
varying vec2 vPieceUv;
varying vec4 vCornerCuts;

float getPieceMask() {
  float feather = 0.028;
  float topLeft = vCornerCuts.x > 0.001
    ? smoothstep(vCornerCuts.x - feather, vCornerCuts.x + feather, vPieceUv.x + (1.0 - vPieceUv.y))
    : 1.0;
  float topRight = vCornerCuts.y > 0.001
    ? smoothstep(vCornerCuts.y - feather, vCornerCuts.y + feather, (1.0 - vPieceUv.x) + (1.0 - vPieceUv.y))
    : 1.0;
  float bottomRight = vCornerCuts.z > 0.001
    ? smoothstep(vCornerCuts.z - feather, vCornerCuts.z + feather, (1.0 - vPieceUv.x) + vPieceUv.y)
    : 1.0;
  float bottomLeft = vCornerCuts.w > 0.001
    ? smoothstep(vCornerCuts.w - feather, vCornerCuts.w + feather, vPieceUv.x + vPieceUv.y)
    : 1.0;
  return topLeft * topRight * bottomRight * bottomLeft;
}

vec4 sampleFragmentTexel() {
  vec4 texel = texture2D(uMap, vMapUv);
  texel.a *= getPieceMask() * uOpacity;
  return texel;
}
`

const createFragmentPassMaterial = (texture: THREE.Texture, pass: 'accum' | 'reveal') => {
  const fragmentShader =
    pass === 'accum'
      ? `
${fragmentShaderCommon}

void main() {
  vec4 texel = sampleFragmentTexel();
  if (texel.a < 0.001) discard;

  float weight = clamp(
    pow(min(1.0, texel.a * 10.0) + 0.01, 3.0) * 1e8 * pow(1.0 - gl_FragCoord.z * 0.9, 3.0),
    1e-2,
    3e3
  );

  gl_FragColor = vec4(texel.rgb * texel.a * weight, texel.a * weight);
}
`
      : `
${fragmentShaderCommon}

void main() {
  vec4 texel = sampleFragmentTexel();
  if (texel.a < 0.001) discard;
  gl_FragColor = vec4(texel.a, texel.a, texel.a, texel.a);
}
`

  const material = new THREE.ShaderMaterial({
    uniforms: {
      uMap: { value: texture },
      uOpacity: { value: FRAGMENT_OPACITY_MIN },
      uTime: { value: 0 },
      uMotion: { value: 0 },
      uFloatAmplitude: { value: FRAGMENT_FLOAT_AMPLITUDE },
      uFloatSpeed: { value: FRAGMENT_FLOAT_SPEED },
      uSpinScale: { value: FRAGMENT_SPIN_SCALE },
      uHoverCursorView: { value: new THREE.Vector2() },
      uHoverRadius: { value: HOVER_INFLUENCE_RADIUS },
      uHoverPush: { value: HOVER_PUSH_DISTANCE },
      uHoverStrength: { value: 0 },
      uHoverProjectMix: { value: 1 },
    },
    vertexShader: fragmentVertexShader,
    fragmentShader,
    transparent: true,
    depthWrite: false,
    depthTest: false,
    side: THREE.DoubleSide,
  })

  material.blending = THREE.CustomBlending
  material.blendEquation = THREE.AddEquation
  material.forceSinglePass = true

  if (pass === 'accum') {
    material.blendSrc = THREE.OneFactor
    material.blendDst = THREE.OneFactor
    material.blendSrcAlpha = THREE.OneFactor
    material.blendDstAlpha = THREE.OneFactor
  } else {
    material.blendSrc = THREE.ZeroFactor
    material.blendDst = THREE.OneMinusSrcColorFactor
    material.blendSrcAlpha = THREE.ZeroFactor
    material.blendDstAlpha = THREE.OneMinusSrcAlphaFactor
  }

  return material
}

const createCompositeMaterial = () => {
  return new THREE.ShaderMaterial({
    uniforms: {
      uAccumTex: { value: null },
      uRevealTex: { value: null },
    },
    vertexShader: `
varying vec2 vUv;
void main() {
  vUv = uv;
  gl_Position = vec4(position.xy, 0.0, 1.0);
}
`,
    fragmentShader: `
uniform sampler2D uAccumTex;
uniform sampler2D uRevealTex;
varying vec2 vUv;

void main() {
  vec4 accum = texture2D(uAccumTex, vUv);
  float reveal = texture2D(uRevealTex, vUv).r;
  float alpha = clamp(1.0 - reveal, 0.0, 1.0);
  vec3 color = alpha > 0.00001 ? accum.rgb / max(accum.a, 0.00001) : vec3(0.0);
  gl_FragColor = vec4(color, alpha);
  #include <colorspace_fragment>
}
`,
    transparent: true,
    depthWrite: false,
    depthTest: false,
  })
}

const initCompositeResources = () => {
  if (!renderer) return

  accumRenderTarget?.dispose()
  revealRenderTarget?.dispose()

  accumRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: false,
    stencilBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.HalfFloatType,
  })
  revealRenderTarget = new THREE.WebGLRenderTarget(1, 1, {
    depthBuffer: false,
    stencilBuffer: false,
    minFilter: THREE.LinearFilter,
    magFilter: THREE.LinearFilter,
    type: THREE.UnsignedByteType,
  })

  compositeScene = new THREE.Scene()
  compositeCamera = new THREE.OrthographicCamera(-1, 1, 1, -1, 0, 1)
  compositeMaterial = createCompositeMaterial()
  compositeQuad = new THREE.Mesh(new THREE.PlaneGeometry(2, 2), compositeMaterial)
  compositeScene.add(compositeQuad)
}

const updateActiveProject = () => {
  if (!projectAxes.length || !camera) return 0

  tempQuaternion.setFromAxisAngle(worldYAxis, rotation.y).invert()
  camera.getWorldDirection(tempCameraDirection)
  tempViewDirection.copy(tempCameraDirection).multiplyScalar(-1).applyQuaternion(tempQuaternion).normalize()

  let bestIndex = 0
  let bestScore = -1

  for (let index = 0; index < projectAxes.length; index += 1) {
    const score = Math.abs(projectAxes[index].dot(tempViewDirection))
    projectAlignmentScores[index] = score
    if (score > bestScore) {
      bestScore = score
      bestIndex = index
    }
  }

  if (bestIndex !== activeProjectIndex.value) {
    activeProjectIndex.value = bestIndex
  }

  return bestScore
}

const resizeScene = () => {
  if (!canvasHost.value || !camera || !renderer) return

  const width = Math.max(canvasHost.value.clientWidth, 1)
  const height = Math.max(canvasHost.value.clientHeight, 1)
  const aspect = width / height

  camera.left = (-VIEW_HEIGHT * aspect) / 2
  camera.right = (VIEW_HEIGHT * aspect) / 2
  camera.top = VIEW_HEIGHT / 2
  camera.bottom = -VIEW_HEIGHT / 2
  camera.near = 0.1
  camera.far = 800
  camera.updateProjectionMatrix()

  renderer.setPixelRatio(Math.min(window.devicePixelRatio || 1, 2))
  renderer.setSize(width, height, false)
  renderer.getDrawingBufferSize(tempRenderSize)
  const renderWidth = Math.max(Math.round(tempRenderSize.x), 1)
  const renderHeight = Math.max(Math.round(tempRenderSize.y), 1)
  accumRenderTarget?.setSize(renderWidth, renderHeight)
  revealRenderTarget?.setSize(renderWidth, renderHeight)

  if (compositeMaterial) {
    compositeMaterial.uniforms.uAccumTex.value = accumRenderTarget?.texture ?? null
    compositeMaterial.uniforms.uRevealTex.value = revealRenderTarget?.texture ?? null
  }

  const targetNavbarContentWidthPx = getTargetNavbarContentWidthPx()
  const unitsPerPixel = VIEW_HEIGHT / height
  const targetPlaneWidthWorld = targetNavbarContentWidthPx * unitsPerPixel
  const fragmentScale = targetPlaneWidthWorld / IMAGE_PLANE_WIDTH
  fragmentGroup.scale.setScalar(fragmentScale)
}

const updatePerformanceDebug = (time: number) => {
  perfSampleFrameCount += 1
  if (!perfSampleStartTime) {
    perfSampleStartTime = time
    return
  }

  const elapsed = time - perfSampleStartTime
  if (elapsed < PERFORMANCE_SAMPLE_MS) return

  debugInfo.value.fps = Math.round((perfSampleFrameCount * 1000) / Math.max(elapsed, 1))
  perfSampleStartTime = time
  perfSampleFrameCount = 0
}

const tick = (time: number) => {
  if (disposed) return
  const delta = lastFrameTime ? time - lastFrameTime : 16
  lastFrameTime = time

  if (!pointerState.isDown && time - pointerState.lastMoveAt > IDLE_PROJECT_ADVANCE_DELAY_MS) {
    goToNextProject()
  }

  if (!pointerState.isDown && time - pointerState.lastMoveAt > 1600) {
    targetRotation.y += delta * AUTO_ROTATE_SPEED
  }

  if (!pointerState.isDown && projectAxes.length) {
    const snap = getNearestSnapTarget(targetRotation.y)
    if (Math.abs(snap.delta) < SNAP_ANGLE_THRESHOLD) {
      targetRotation.y += snap.delta * SNAP_PULL
      if (Math.abs(snap.delta) < SNAP_SETTLE_THRESHOLD) {
        targetRotation.y = snap.yaw
      }
    }
  }

  rotation.y += (targetRotation.y - rotation.y) * ROTATION_LERP
  rotationX.value += (targetRotationX.value - rotationX.value) * ROTATION_X_LERP

  fragmentGroup.rotation.set(rotationX.value, rotation.y, 0)
  updateActiveProject()
  updatePerformanceDebug(time)
  updateFragmentHoverPhysics()

  const axisSpacing = projectAxes.length > 1 ? Math.PI / projectAxes.length : Math.PI / 2
  const baseFalloffAngle = Math.max(axisSpacing * FALLOFF_TO_MIN_AXIS_FRACTION, 0.0001)
  const visualFalloffAngle = clamp(baseFalloffAngle * VISUAL_FALLOFF_MULTIPLIER, 0.0001, Math.PI / 2)
  const visualBufferAngle = Math.min(
    clamp(
      axisSpacing * VISUAL_ALIGNMENT_BUFFER_AXIS_FRACTION,
      VISUAL_ALIGNMENT_BUFFER_MIN_ANGLE,
      VISUAL_ALIGNMENT_BUFFER_MAX_ANGLE
    ),
    Math.max(visualFalloffAngle - 0.0001, 0)
  )
  const maxAlignmentScore = projectAlignmentScores.reduce((best, value) => {
    return Math.max(best, clamp(value ?? 0, 0, 1))
  }, 0)

  softClosestWeights.fill(0)
  for (let index = 0; index < fragmentMeshes.length; index += 1) {
    const mesh = fragmentMeshes[index]
    if (!mesh) continue
    const meshData = mesh.userData as FragmentMeshData
    const projectIndex = meshData.projectIndex ?? 0
    if (softClosestWeights[projectIndex] > 0) continue

    const score = clamp(projectAlignmentScores[projectIndex] ?? 0, 0, 1)
    const weight = Math.exp((score - maxAlignmentScore) * CLOSEST_PROJECT_SOFT_SELECTION)
    softClosestWeights[projectIndex] = weight
  }

  let visibleFragments = 0
  for (let index = 0; index < fragmentMeshes.length; index += 1) {
    const mesh = fragmentMeshes[index]
    if (!mesh) continue

    const meshData = mesh.userData as FragmentMeshData
    const projectIndex = meshData.projectIndex ?? 0
    const alignment = clamp(projectAlignmentScores[projectIndex] ?? 0, 0, 1)
    const angleToAxis = Math.acos(clamp(alignment, 0, 1))
    const proximityVisual = proximityWithBuffer(angleToAxis, visualFalloffAngle, visualBufferAngle)
    const easedOpacity = Math.pow(proximityVisual, FRAGMENT_OPACITY_ALIGNMENT_EXP)
    const opacity = FRAGMENT_OPACITY_MIN + (FRAGMENT_OPACITY_MAX - FRAGMENT_OPACITY_MIN) * easedOpacity
    const maxFragments = meshData.maxFragments ?? 0
    if (meshData.drawCount !== maxFragments) {
      mesh.count = maxFragments
      meshData.drawCount = maxFragments
    }

    const accumMaterial = fragmentAccumMaterials[index]
    const revealMaterial = fragmentRevealMaterials[index]
    const materialTime = time * 0.001

    if (accumMaterial) {
      accumMaterial.uniforms.uOpacity.value = opacity
      accumMaterial.uniforms.uTime.value = materialTime
      accumMaterial.uniforms.uMotion.value = 0
      accumMaterial.uniforms.uHoverStrength.value = 0
    }

    if (revealMaterial) {
      revealMaterial.uniforms.uOpacity.value = opacity
      revealMaterial.uniforms.uTime.value = materialTime
      revealMaterial.uniforms.uMotion.value = 0
      revealMaterial.uniforms.uHoverStrength.value = 0
    }

    visibleFragments += mesh.count
  }

  debugInfo.value.visibleFragments = visibleFragments
  debugInfo.value.totalFragments = totalFragmentCount

  if (
    renderer &&
    scene &&
    camera &&
    accumRenderTarget &&
    revealRenderTarget &&
    compositeScene &&
    compositeCamera &&
    compositeMaterial
  ) {
    for (let index = 0; index < fragmentMeshes.length; index += 1) {
      const mesh = fragmentMeshes[index]
      const material = fragmentAccumMaterials[index]
      if (!mesh || !material) continue
      mesh.material = material
    }

    renderer.setRenderTarget(accumRenderTarget)
    renderer.setClearColor(0x000000, 0)
    renderer.clear(true, false, false)
    renderer.render(scene, camera)

    for (let index = 0; index < fragmentMeshes.length; index += 1) {
      const mesh = fragmentMeshes[index]
      const material = fragmentRevealMaterials[index]
      if (!mesh || !material) continue
      mesh.material = material
    }

    renderer.setRenderTarget(revealRenderTarget)
    renderer.setClearColor(0xffffff, 1)
    renderer.clear(true, false, false)
    renderer.render(scene, camera)

    compositeMaterial.uniforms.uAccumTex.value = accumRenderTarget.texture
    compositeMaterial.uniforms.uRevealTex.value = revealRenderTarget.texture

    renderer.setRenderTarget(null)
    renderer.setClearColor(0x000000, 0)
    renderer.clear(true, false, false)
    renderer.render(compositeScene, compositeCamera)
  }

  animationFrame = window.requestAnimationFrame(tick)
}

const handlePointerDown = (event: PointerEvent) => {
  clearHoverPointer()
  pointerState.isDown = true
  pointerState.startX = event.clientX
  pointerState.startY = event.clientY
  pointerState.startRotY = targetRotation.y
  pointerState.startRotX = targetRotationX.value
  pointerState.lastMoveAt = performance.now()
  isDragging.value = true

  canvasHost.value?.setPointerCapture(event.pointerId)
}

const handlePointerMove = (event: PointerEvent) => {
  updateHoverPointerFromEvent(event)
  if (!pointerState.isDown) return

  const deltaX = event.clientX - pointerState.startX
  const deltaY = event.clientY - pointerState.startY
  targetRotation.y = pointerState.startRotY + deltaX * ROTATION_DRAG_FACTOR

  const absDeltaY = Math.abs(deltaY)
  if (absDeltaY <= ROTATION_X_DRAG_THRESHOLD_PX) {
    targetRotationX.value = 0
  } else {
    const thresholdedDeltaY = deltaY - Math.sign(deltaY) * ROTATION_X_DRAG_THRESHOLD_PX
    targetRotationX.value = clamp(
      pointerState.startRotX + thresholdedDeltaY * ROTATION_DRAG_FACTOR * 2,
      -ROTATION_X_MAX,
      ROTATION_X_MAX
    )
  }

  pointerState.lastMoveAt = performance.now()
}

const handlePointerUp = (event: PointerEvent) => {
  if (event.type === 'pointerleave' || event.type === 'pointercancel') {
    clearHoverPointer()
  }

  if (!pointerState.isDown) {
    isDragging.value = false
    return
  }

  pointerState.isDown = false
  targetRotationX.value = 0
  pointerState.lastMoveAt = performance.now()
  isDragging.value = false

  if (projectAxes.length) {
    const snap = getNearestSnapTarget(targetRotation.y)
    if (Math.abs(snap.delta) < SNAP_ANGLE_THRESHOLD) {
      targetRotation.y = snap.yaw
    }
  }

  if (canvasHost.value?.hasPointerCapture(event.pointerId)) {
    canvasHost.value.releasePointerCapture(event.pointerId)
  }
}

const initScene = async () => {
  if (!canvasHost.value || !projects.length) return

  scene = new THREE.Scene()
  camera = new THREE.OrthographicCamera()
  camera.position.set(0, 0, 220)
  camera.lookAt(0, 0, 0)

  renderer = new THREE.WebGLRenderer({
    antialias: true,
    alpha: true,
    powerPreference: 'high-performance',
  })
  renderer.outputColorSpace = THREE.SRGBColorSpace
  renderer.setClearColor(0x000000, 0)

  canvasHost.value.appendChild(renderer.domElement)
  scene.add(fragmentGroup)
  initCompositeResources()

  const resources = await buildFragmentResources()
  if (disposed) {
    resources.forEach((resource) => {
      resource?.buckets.forEach((bucket) => bucket.geometry.dispose())
      resource?.texture.dispose()
    })
    return
  }

  fragmentMeshes.length = 0
  fragmentTextures.length = projects.length
  fragmentTextures.fill(null)
  fragmentAccumMaterials.length = 0
  fragmentRevealMaterials.length = 0
  totalFragmentCount = 0
  perfSampleStartTime = 0
  perfSampleFrameCount = 0

  const maxBucketCount = resources.reduce((maxCount, resource) => {
    return Math.max(maxCount, resource?.buckets.length ?? 0)
  }, 0)

  for (let index = 0; index < projects.length; index += 1) {
    const resource = resources[index]
    if (!resource) continue
    resource.texture.anisotropy = renderer.capabilities.getMaxAnisotropy()
    fragmentTextures[index] = resource.texture
    totalFragmentCount += resource.maxFragments
  }

  for (let bucketIndex = 0; bucketIndex < maxBucketCount; bucketIndex += 1) {
    for (let projectIndex = 0; projectIndex < projects.length; projectIndex += 1) {
      const resource = resources[projectIndex]
      const bucket = resource?.buckets[bucketIndex]
      if (!resource || !bucket) continue

      const accumMaterial = createFragmentPassMaterial(resource.texture, 'accum')
      const revealMaterial = createFragmentPassMaterial(resource.texture, 'reveal')
      const mesh = new THREE.InstancedMesh(bucket.geometry, accumMaterial, bucket.maxFragments)
      const basePositions = new Float32Array(bucket.maxFragments * 3)
      const currentPositions = new Float32Array(bucket.maxFragments * 3)
      const velocities = new Float32Array(bucket.maxFragments * 3)
      const quaternions: THREE.Quaternion[] = new Array(bucket.maxFragments)
      const inverseQuaternions: THREE.Quaternion[] = new Array(bucket.maxFragments)
      const scales: THREE.Vector3[] = new Array(bucket.maxFragments)
      const randoms = new Float32Array(bucket.maxFragments)
      const spinAngles = new Float32Array(bucket.maxFragments * 3)
      const spinVelocities = new Float32Array(bucket.maxFragments * 3)
      const spinDirections = new Float32Array(bucket.maxFragments * 3)
      mesh.frustumCulled = false
      mesh.renderOrder = bucketIndex * projects.length + projectIndex

      for (let fragmentIndex = 0; fragmentIndex < bucket.matrices.length; fragmentIndex += 1) {
        mesh.setMatrixAt(fragmentIndex, bucket.matrices[fragmentIndex])

        const positionOffset = fragmentIndex * 3
        bucket.matrices[fragmentIndex].decompose(tempPosition, tempQuaternion, tempScale)
        basePositions[positionOffset] = tempPosition.x
        basePositions[positionOffset + 1] = tempPosition.y
        basePositions[positionOffset + 2] = tempPosition.z
        currentPositions[positionOffset] = tempPosition.x
        currentPositions[positionOffset + 1] = tempPosition.y
        currentPositions[positionOffset + 2] = tempPosition.z
        quaternions[fragmentIndex] = tempQuaternion.clone()
        inverseQuaternions[fragmentIndex] = tempQuaternion.clone().invert()
        scales[fragmentIndex] = tempScale.clone()
        randoms[fragmentIndex] = Math.random()
        spinAngles[positionOffset] = 0
        spinAngles[positionOffset + 1] = 0
        spinAngles[positionOffset + 2] = 0
        spinVelocities[positionOffset] = 0
        spinVelocities[positionOffset + 1] = 0
        spinVelocities[positionOffset + 2] = 0
        spinDirections[positionOffset] = 1
        spinDirections[positionOffset + 1] = 1
        spinDirections[positionOffset + 2] = 1
      }
      mesh.instanceMatrix.needsUpdate = true

      mesh.userData = {
        ...mesh.userData,
        projectIndex,
        bucketIndex,
        maxFragments: bucket.maxFragments,
        drawCount: bucket.maxFragments,
        physics: {
          basePositions,
          currentPositions,
          velocities,
          quaternions,
          inverseQuaternions,
          scales,
          randoms,
          spinAngles,
          spinVelocities,
          spinDirections,
        },
      } satisfies FragmentMeshData

      mesh.count = bucket.maxFragments
      fragmentGroup.add(mesh)
      fragmentMeshes.push(mesh)
      fragmentAccumMaterials.push(accumMaterial)
      fragmentRevealMaterials.push(revealMaterial)
    }
  }

  debugInfo.value.totalFragments = totalFragmentCount
  debugInfo.value.visibleFragments = totalFragmentCount
  debugInfo.value.fps = 0

  resizeScene()
  pointerState.lastMoveAt = performance.now()
  webglReady.value = true
  animationFrame = window.requestAnimationFrame(tick)
}

const cleanupScene = () => {
  disposed = true
  webglReady.value = false
  clearHoverPointer()

  if (animationFrame) {
    cancelAnimationFrame(animationFrame)
    animationFrame = null
  }

  if (canvasHost.value) {
    canvasHost.value.removeEventListener('pointerdown', handlePointerDown)
    canvasHost.value.removeEventListener('pointermove', handlePointerMove)
    canvasHost.value.removeEventListener('pointerup', handlePointerUp)
    canvasHost.value.removeEventListener('pointerleave', handlePointerUp)
    canvasHost.value.removeEventListener('pointercancel', handlePointerUp)
  }

  resizeObserver?.disconnect()
  resizeObserver = null

  for (let index = 0; index < fragmentMeshes.length; index += 1) {
    const mesh = fragmentMeshes[index]
    if (!mesh) continue

    mesh.geometry.dispose()
    fragmentGroup.remove(mesh)
    fragmentMeshes[index] = null
  }

  for (let index = 0; index < fragmentAccumMaterials.length; index += 1) {
    fragmentAccumMaterials[index]?.dispose()
    fragmentAccumMaterials[index] = null
  }

  for (let index = 0; index < fragmentRevealMaterials.length; index += 1) {
    fragmentRevealMaterials[index]?.dispose()
    fragmentRevealMaterials[index] = null
  }

  for (let index = 0; index < fragmentTextures.length; index += 1) {
    fragmentTextures[index]?.dispose()
    fragmentTextures[index] = null
  }

  fragmentMeshes.length = 0
  fragmentTextures.length = 0
  fragmentAccumMaterials.length = 0
  fragmentRevealMaterials.length = 0
  totalFragmentCount = 0
  perfSampleStartTime = 0
  perfSampleFrameCount = 0
  debugInfo.value.totalFragments = 0
  debugInfo.value.visibleFragments = 0
  debugInfo.value.fps = 0

  accumRenderTarget?.dispose()
  revealRenderTarget?.dispose()
  accumRenderTarget = null
  revealRenderTarget = null

  if (compositeQuad) {
    compositeScene?.remove(compositeQuad)
    compositeQuad.geometry.dispose()
    compositeQuad = null
  }

  compositeMaterial?.dispose()
  compositeMaterial = null
  compositeScene = null
  compositeCamera = null

  if (renderer) {
    renderer.setRenderTarget(null)
    renderer.dispose()
    renderer.domElement.remove()
    renderer = null
  }

  scene = null
  camera = null
}

onMounted(async () => {
  if (!canvasHost.value || !projects.length) return

  canvasHost.value.addEventListener('pointerdown', handlePointerDown)
  canvasHost.value.addEventListener('pointermove', handlePointerMove)
  canvasHost.value.addEventListener('pointerup', handlePointerUp)
  canvasHost.value.addEventListener('pointerleave', handlePointerUp)
  canvasHost.value.addEventListener('pointercancel', handlePointerUp)

  resizeObserver = new ResizeObserver(() => {
    resizeScene()
  })
  resizeObserver.observe(canvasHost.value)

  try {
    await initScene()
  } catch {
    webglReady.value = false
  }
})

onUnmounted(() => {
  cleanupScene()
})
</script>

<template>
  <div class="home-hero">
    <div class="hero-atmosphere" aria-hidden="true"></div>

    <div
      ref="canvasHost"
      :class="['hero-canvas', { 'is-dragging': isDragging }]"
      aria-label="Interactive floating collage of project image fragments"
    ></div>

    <button
      v-if="projects.length > 1"
      class="hero-nav hero-nav--prev"
      type="button"
      aria-label="Show previous project"
      @click="goToPreviousProject"
    >
      <img :src="chevronIcon" alt="" />
    </button>

    <button
      v-if="projects.length > 1"
      class="hero-nav hero-nav--next"
      type="button"
      aria-label="Show next project"
      @click="goToNextProject"
    >
      <img :src="chevronIcon" alt="" />
    </button>

    <div class="hero-ui" v-if="projects.length">
      <button class="hero-open" type="button" :aria-label="`Open ${activeProject?.title}`" @click="openActiveProject">
        {{ activeProject?.title }}
      </button>
    </div>

    <div class="hero-debug" v-if="showDebug && webglReady">
      <div>FPS: {{ debugInfo.fps }}</div>
      <div>
        Fragments:
        {{ debugInfo.visibleFragments.toLocaleString() }} /
        {{ debugInfo.totalFragments.toLocaleString() }}
      </div>
    </div>
  </div>
</template>

<style scoped>
.home-hero {
  position: relative;
  width: 100%;
  height: 80vh;
  min-height: 560px;
  margin-top: 60px;
  overflow: hidden;
  border-bottom: 1px solid var(--site-border);
}

.hero-atmosphere {
  position: absolute;
  inset: -8% -12%;
  background:
    linear-gradient(to top, rgba(0, 0, 0, 0.45), rgba(0, 0, 0, 0.08) 32%, rgba(0, 0, 0, 0.52)),
    radial-gradient(circle at 50% 60%, rgba(255, 255, 255, 0.08), transparent 58%);
  pointer-events: none;
  z-index: 1;
}

.hero-canvas {
  position: absolute;
  inset: 0;
  z-index: 2;
  cursor: grab;
  touch-action: none;
}

.hero-canvas.is-dragging {
  cursor: grabbing;
}

.hero-canvas :deep(canvas) {
  width: 100%;
  height: 100%;
  display: block;
}

.hero-nav {
  position: absolute;
  top: 50%;
  z-index: 3;
  width: 3rem;
  height: 3rem;
  display: grid;
  place-items: center;
  border: 1px solid rgba(255, 255, 255, 0.18);
  border-radius: 999px;
  background: rgba(12, 12, 12, 0.38);
  backdrop-filter: blur(12px);
  cursor: pointer;
  transform: translateY(-50%);
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
}

.hero-nav img {
  width: 1rem;
  height: 1rem;
  display: block;
  filter: brightness(0) invert(1);
}

.hero-nav--prev {
  left: 1rem;
}

.hero-nav--prev img {
  transform: rotate(90deg);
}

.hero-nav--next {
  right: 1rem;
}

.hero-nav--next img {
  transform: rotate(-90deg);
}

.hero-nav:hover {
  border-color: rgba(255, 255, 255, 0.42);
  background: rgba(12, 12, 12, 0.56);
}

.hero-nav:active {
  transform: translateY(-50%) scale(0.97);
}

.hero-ui {
  position: absolute;
  left: 50%;
  bottom: 1rem;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.55rem;
  padding: 0 1rem;
}

.hero-hint {
  margin: 0;
  padding: 0.48rem 0.82rem;
  border-radius: 999px;
  border: 1px solid rgba(255, 255, 255, 0.14);
  background: rgba(12, 12, 12, 0.34);
  color: rgba(255, 255, 255, 0.8);
  font-size: 0.7rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  text-align: center;
  backdrop-filter: blur(12px);
}

.hero-open {
  border: 1px solid rgba(255, 255, 255, 0.22);
  background: rgba(12, 12, 12, 0.42);
  color: #ffffff;
  padding: 0.68rem 1.05rem;
  border-radius: 999px;
  font-size: 0.82rem;
  letter-spacing: 0.08em;
  text-transform: uppercase;
  cursor: pointer;
  transition: border-color 0.2s ease, background-color 0.2s ease, transform 0.2s ease;
  backdrop-filter: blur(12px);
}

.hero-open:hover {
  border-color: rgba(255, 255, 255, 0.48);
  background: rgba(12, 12, 12, 0.58);
  transform: translateY(-1px);
}

.light-mode .hero-hint {
  border-color: rgba(0, 0, 0, 0.1);
  background: rgba(255, 255, 255, 0.58);
  color: rgba(0, 0, 0, 0.72);
}

.light-mode .hero-nav {
  border-color: rgba(0, 0, 0, 0.14);
  background: rgba(255, 255, 255, 0.56);
}

.light-mode .hero-nav img {
  filter: none;
}

.light-mode .hero-nav:hover {
  border-color: rgba(0, 0, 0, 0.3);
  background: rgba(255, 255, 255, 0.76);
}

.light-mode .hero-open {
  border-color: rgba(0, 0, 0, 0.2);
  background: rgba(255, 255, 255, 0.52);
  color: #111111;
}

.light-mode .hero-open:hover {
  border-color: rgba(0, 0, 0, 0.4);
  background: rgba(255, 255, 255, 0.72);
}

.hero-debug {
  position: absolute;
  top: 0.85rem;
  left: 0.85rem;
  z-index: 4;
  font-size: 0.7rem;
  line-height: 1.35;
  letter-spacing: 0.04em;
  padding: 0.5rem 0.62rem;
  border-radius: 8px;
  background: rgba(0, 0, 0, 0.46);
  border: 1px solid rgba(255, 255, 255, 0.2);
  color: rgba(255, 255, 255, 0.9);
  backdrop-filter: blur(8px);
  user-select: none;
  pointer-events: none;
}

.light-mode .hero-debug {
  background: rgba(255, 255, 255, 0.7);
  border-color: rgba(0, 0, 0, 0.18);
  color: rgba(0, 0, 0, 0.82);
}

@media (max-width: 768px) {
  .home-hero {
    height: 68vh;
    min-height: 460px;
  }

  .hero-nav {
    width: 2.55rem;
    height: 2.55rem;
  }

  .hero-nav--prev {
    left: 0.75rem;
  }

  .hero-nav--next {
    right: 0.75rem;
  }

  .hero-ui {
    bottom: 0.85rem;
    gap: 0.45rem;
  }

  .hero-hint {
    font-size: 0.62rem;
    letter-spacing: 0.06em;
    padding: 0.42rem 0.72rem;
  }

  .hero-open {
    font-size: 0.74rem;
    letter-spacing: 0.06em;
    padding: 0.62rem 0.88rem;
  }
}
</style>
