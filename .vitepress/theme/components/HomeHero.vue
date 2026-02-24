<script setup lang="ts">
import { computed, onMounted, onUnmounted, ref } from 'vue'
import { useRouter, withBase } from 'vitepress'
import * as THREE from 'three'
import { data as projectsData } from '../projects.data.mjs'

const allProjects = projectsData.filter((project) => project.image && !project.link.includes('_template'))
const PROJECT_LIMIT = 11
const projects = allProjects.slice(0, PROJECT_LIMIT)

const canvasHost = ref<HTMLDivElement | null>(null)
const activeProjectIndex = ref(0)
const isDragging = ref(false)
const webglReady = ref(false)

const activeProject = computed(() => {
  return projects[activeProjectIndex.value] ?? projects[0]
})

const router = useRouter()

let renderer: THREE.WebGLRenderer | null = null
let scene: THREE.Scene | null = null
let camera: THREE.OrthographicCamera | null = null
const pointClouds: Array<THREE.Points<THREE.BufferGeometry, THREE.PointsMaterial> | null> = []
let animationFrame: number | null = null
let resizeObserver: ResizeObserver | null = null
let disposed = false
let lastFrameTime = 0

const cloudGroup = new THREE.Group()
const projectAxes: THREE.Vector3[] = []

const tempQuaternion = new THREE.Quaternion()
const tempViewDirection = new THREE.Vector3()
const tempCameraDirection = new THREE.Vector3()
const projectAlignmentScores: number[] = []

const rotation = { y: 0 }
const targetRotation = { y: 0 }

const pointerState = {
  isDown: false,
  startX: 0,
  startRotY: 0,
  lastMoveAt: 0,
}

const VIEW_HEIGHT = 100
const IMAGE_PLANE_HEIGHT = 77
const NORMALIZED_IMAGE_ASPECT = 16 / 9
const IMAGE_PLANE_WIDTH = IMAGE_PLANE_HEIGHT * NORMALIZED_IMAGE_ASPECT
const DEPTH_SPREAD = 100
const TARGET_POINTS_PER_PROJECT = 100000
const ROTATION_LERP = 0.12
const AUTO_ROTATE_SPEED = 0
const POINT_SIZE_MIN = 1.5
const POINT_SIZE_MAX = 2.1
const POINT_SIZE_ALIGNMENT_EXP = 2.4
const CLOUD_OPACITY_MIN = 0.1
const CLOUD_OPACITY_MAX = 1.0
const CLOUD_OPACITY_ALIGNMENT_EXP = 1.8
const FALLOFF_TO_MIN_AXIS_FRACTION = 0.72
const VISUAL_FALLOFF_MULTIPLIER = 2
const PARTICLE_LOD_MIN_FRACTION = 0.2
const PARTICLE_LOD_ALIGNMENT_EXP = 1.6
const PARTICLE_LOD_FALLOFF_ANGLE = Math.PI / 2
const DUST_MOTION_AMPLITUDE = 5.35
const DUST_MOTION_VERTICAL_SCALE = 1.5
const DUST_MOTION_SPEED = 0.25
const CLOSEST_PROJECT_LOCK_EXP = 1.6
const CLOSEST_PROJECT_SOFT_SELECTION = 24
const SNAP_ANGLE_THRESHOLD = THREE.MathUtils.degToRad(20)
const SNAP_PULL = 0.22
const SNAP_SETTLE_THRESHOLD = THREE.MathUtils.degToRad(0.25)
const PROJECT_CARD_MAX_WIDTH_FALLBACK_PX = 860

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

const srgbToLinear = (channel: number) => {
  if (channel <= 0.04045) return channel / 12.92
  return Math.pow((channel + 0.055) / 1.055, 2.4)
}

const getTargetProjectCardWidthPx = () => {
  if (typeof document === 'undefined') return PROJECT_CARD_MAX_WIDTH_FALLBACK_PX

  const projectCard = document.querySelector('#projects .project-card') as HTMLElement | null
  if (projectCard) {
    const measuredWidth = projectCard.getBoundingClientRect().width
    if (measuredWidth > 0) return measuredWidth
  }

  const rootStyles = getComputedStyle(document.documentElement)
  const rawMaxWidth = rootStyles.getPropertyValue('--project-card-max-width').trim()
  const parsedMaxWidth = Number.parseFloat(rawMaxWidth)
  if (Number.isFinite(parsedMaxWidth) && parsedMaxWidth > 0) {
    return parsedMaxWidth
  }

  return PROJECT_CARD_MAX_WIDTH_FALLBACK_PX
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

const buildPointCloudGeometries = async () => {
  const geometries: Array<THREE.BufferGeometry | null> = new Array(projects.length).fill(null)
  if (!projects.length) return geometries

  // Distribute over 180deg because +axis and -axis are the same projection axis.
  const axisStep = Math.PI / projects.length

  projectAxes.length = 0
  projectAlignmentScores.length = projects.length
  for (let index = 0; index < projects.length; index += 1) {
    const angle = axisStep * index
    projectAxes[index] = new THREE.Vector3(Math.sin(angle), 0, Math.cos(angle)).normalize()
    projectAlignmentScores[index] = 0
  }

  for (let index = 0; index < projects.length; index += 1) {
    const project = projects[index]
    const imageUrl = withBase(project.image)

    let image: HTMLImageElement | null = null
    try {
      image = await loadImage(imageUrl)
    } catch {
      continue
    }

    if (!image.naturalWidth || !image.naturalHeight) continue

    const axis = projectAxes[index]
    const sourceAspect = image.naturalWidth / image.naturalHeight
    const sampleHeight = Math.max(
      22,
      Math.round(Math.sqrt(TARGET_POINTS_PER_PROJECT / Math.max(NORMALIZED_IMAGE_ASPECT, 0.1)))
    )
    const sampleWidth = Math.max(22, Math.round(sampleHeight * NORMALIZED_IMAGE_ASPECT))

    const sampleCanvas = document.createElement('canvas')
    sampleCanvas.width = sampleWidth
    sampleCanvas.height = sampleHeight

    const ctx = sampleCanvas.getContext('2d', { willReadFrequently: true })
    if (!ctx) continue

    const positions: number[] = []
    const colors: number[] = []
    const motionDirs: number[] = []
    const motionPhases: number[] = []

    // Center-crop each source image to a shared aspect ratio (no stretching).
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

    ctx.drawImage(
      image,
      sourceX,
      sourceY,
      sourceWidth,
      sourceHeight,
      0,
      0,
      sampleWidth,
      sampleHeight
    )
    const { data } = ctx.getImageData(0, 0, sampleWidth, sampleHeight)
    const planeWidth = IMAGE_PLANE_WIDTH

    for (let y = 0; y < sampleHeight; y += 1) {
      for (let x = 0; x < sampleWidth; x += 1) {
        const offset = (y * sampleWidth + x) * 4
        const alpha = data[offset + 3]
        if (alpha < 10) continue

        const nx = sampleWidth > 1 ? x / (sampleWidth - 1) : 0.5
        const ny = sampleHeight > 1 ? y / (sampleHeight - 1) : 0.5

        const baseX = (nx - 0.5) * planeWidth
        const baseY = (0.5 - ny) * IMAGE_PLANE_HEIGHT
        const depthOffset = (Math.random() * 2 - 1) * DEPTH_SPREAD

        // Project-specific in-plane axis (perpendicular to displacement axis in XZ).
        const planeAxisX = axis.z
        const planeAxisZ = -axis.x

        positions.push(
          planeAxisX * baseX + axis.x * depthOffset,
          baseY,
          planeAxisZ * baseX + axis.z * depthOffset
        )

        const r = srgbToLinear(data[offset] / 255)
        const g = srgbToLinear(data[offset + 1] / 255)
        const b = srgbToLinear(data[offset + 2] / 255)
        colors.push(r, g, b)

        let randomX = Math.random() * 2 - 1
        let randomY = Math.random() * 2 - 1
        let randomZ = Math.random() * 2 - 1
        const randomLength = Math.hypot(randomX, randomY, randomZ) || 1
        randomX /= randomLength
        randomY /= randomLength
        randomZ /= randomLength

        motionDirs.push(randomX, randomY, randomZ)
        motionPhases.push(Math.random() * Math.PI * 2)
      }
    }

    if (!positions.length) continue

    // Shuffle particles so drawRange LOD removes points evenly across the full image.
    const particleCount = positions.length / 3
    for (let i = particleCount - 1; i > 0; i -= 1) {
      const j = Math.floor(Math.random() * (i + 1))
      if (i === j) continue

      const ia = i * 3
      const ja = j * 3

      for (let k = 0; k < 3; k += 1) {
        const posTemp = positions[ia + k]
        positions[ia + k] = positions[ja + k]
        positions[ja + k] = posTemp

        const colorTemp = colors[ia + k]
        colors[ia + k] = colors[ja + k]
        colors[ja + k] = colorTemp

        const motionDirTemp = motionDirs[ia + k]
        motionDirs[ia + k] = motionDirs[ja + k]
        motionDirs[ja + k] = motionDirTemp
      }

      const phaseTemp = motionPhases[i]
      motionPhases[i] = motionPhases[j]
      motionPhases[j] = phaseTemp
    }

    const geometry = new THREE.BufferGeometry()
    geometry.setAttribute('position', new THREE.Float32BufferAttribute(positions, 3))
    geometry.setAttribute('color', new THREE.Float32BufferAttribute(colors, 3))
    geometry.setAttribute('motionDir', new THREE.Float32BufferAttribute(motionDirs, 3))
    geometry.setAttribute('motionPhase', new THREE.Float32BufferAttribute(motionPhases, 1))
    geometries[index] = geometry
  }

  return geometries
}

const updateActiveProject = () => {
  if (!projectAxes.length || !camera) return 0

  tempQuaternion.copy(cloudGroup.quaternion).invert()
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

  const targetProjectCardWidthPx = getTargetProjectCardWidthPx()
  const unitsPerPixel = VIEW_HEIGHT / height
  const targetPlaneWidthWorld = targetProjectCardWidthPx * unitsPerPixel
  const cloudScale = targetPlaneWidthWorld / IMAGE_PLANE_WIDTH
  cloudGroup.scale.setScalar(cloudScale)
}

const tick = (time: number) => {
  if (disposed) return
  const delta = lastFrameTime ? time - lastFrameTime : 16
  lastFrameTime = time

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

  // Single-axis rotation makes finding each anamorphic alignment easier.
  cloudGroup.rotation.set(0, rotation.y, 0)
  updateActiveProject()
  const axisSpacing = projectAxes.length > 1 ? Math.PI / projectAxes.length : Math.PI / 2
  const baseFalloffAngle = Math.max(axisSpacing * FALLOFF_TO_MIN_AXIS_FRACTION, 0.0001)
  const visualFalloffAngle = clamp(baseFalloffAngle * VISUAL_FALLOFF_MULTIPLIER, 0.0001, Math.PI / 2)
  const lodFalloffAngle = Math.max(PARTICLE_LOD_FALLOFF_ANGLE, 0.0001)
  const maxAlignmentScore = projectAlignmentScores.reduce((best, value) => {
    return Math.max(best, clamp(value ?? 0, 0, 1))
  }, 0)
  const softClosestWeights: number[] = new Array(pointClouds.length).fill(0)
  let softClosestWeightMax = 0
  for (let index = 0; index < pointClouds.length; index += 1) {
    if (!pointClouds[index]) continue
    const score = clamp(projectAlignmentScores[index] ?? 0, 0, 1)
    const weight = Math.exp((score - maxAlignmentScore) * CLOSEST_PROJECT_SOFT_SELECTION)
    softClosestWeights[index] = weight
    softClosestWeightMax = Math.max(softClosestWeightMax, weight)
  }

  for (let index = 0; index < pointClouds.length; index += 1) {
    const cloud = pointClouds[index]
    if (!cloud) continue
    const alignment = clamp(projectAlignmentScores[index] ?? 0, 0, 1)
    // Visuals and LOD both use angle falloff; LOD spans 90deg, visuals are extended.
    const angleToAxis = Math.acos(clamp(alignment, 0, 1))
    const proximityVisual = 1 - clamp(angleToAxis / visualFalloffAngle, 0, 1)
    const proximityLod = 1 - clamp(angleToAxis / lodFalloffAngle, 0, 1)
    const easedSize = Math.pow(proximityVisual, POINT_SIZE_ALIGNMENT_EXP)
    const easedOpacity = Math.pow(proximityVisual, CLOUD_OPACITY_ALIGNMENT_EXP)
    cloud.material.size = POINT_SIZE_MIN + (POINT_SIZE_MAX - POINT_SIZE_MIN) * easedSize
    cloud.material.opacity = CLOUD_OPACITY_MIN + (CLOUD_OPACITY_MAX - CLOUD_OPACITY_MIN) * easedOpacity

    const lodFactor = Math.pow(proximityLod, PARTICLE_LOD_ALIGNMENT_EXP)
    const lodFraction = PARTICLE_LOD_MIN_FRACTION + (1 - PARTICLE_LOD_MIN_FRACTION) * lodFactor
    const cloudData = cloud.userData as { maxPoints?: number; drawCount?: number }
    const maxPoints = cloudData.maxPoints ?? cloud.geometry.getAttribute('position').count
    const nextDrawCount = Math.max(1, Math.round(maxPoints * lodFraction))
    if (cloudData.drawCount !== nextDrawCount) {
      cloud.geometry.setDrawRange(0, nextDrawCount)
      cloudData.drawCount = nextDrawCount
    }

    const shader = (cloud.material.userData as { shader?: any }).shader
    if (shader) {
      const closestWeight =
        softClosestWeightMax > 0 ? (softClosestWeights[index] ?? 0) / softClosestWeightMax : 0
      const lockAmount = Math.pow(proximityVisual, CLOSEST_PROJECT_LOCK_EXP) * closestWeight
      const motionStrength = clamp(1 - lockAmount, 0, 1)

      ;(shader.uniforms.uTime as { value: number }).value = time * 0.001
      ;(shader.uniforms.uMotion as { value: number }).value = motionStrength
    }
  }

  renderer?.render(scene as THREE.Scene, camera as THREE.OrthographicCamera)
  animationFrame = window.requestAnimationFrame(tick)
}

const handlePointerDown = (event: PointerEvent) => {
  pointerState.isDown = true
  pointerState.startX = event.clientX
  pointerState.startRotY = targetRotation.y
  pointerState.lastMoveAt = performance.now()
  isDragging.value = true

  canvasHost.value?.setPointerCapture(event.pointerId)
}

const handlePointerMove = (event: PointerEvent) => {
  if (!pointerState.isDown) return

  const deltaX = event.clientX - pointerState.startX
  targetRotation.y = pointerState.startRotY + deltaX * 0.006
  pointerState.lastMoveAt = performance.now()
}

const handlePointerUp = (event: PointerEvent) => {
  pointerState.isDown = false
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
  scene.add(cloudGroup)

  const geometries = await buildPointCloudGeometries()
  if (disposed) {
    geometries.forEach((geometry) => geometry?.dispose())
    return
  }

  pointClouds.length = projects.length
  for (let index = 0; index < projects.length; index += 1) {
    const geometry = geometries[index]
    if (!geometry) {
      pointClouds[index] = null
      continue
    }

    const material = new THREE.PointsMaterial({
      size: POINT_SIZE_MIN,
      vertexColors: true,
      transparent: true,
      opacity: CLOUD_OPACITY_MIN,
      depthWrite: false,
      blending: THREE.NormalBlending,
      sizeAttenuation: false,
    })
    material.onBeforeCompile = (shader) => {
      shader.uniforms.uTime = { value: 0 }
      shader.uniforms.uMotion = { value: 1 }
      shader.uniforms.uDustAmplitude = { value: DUST_MOTION_AMPLITUDE }
      shader.uniforms.uDustVerticalScale = { value: DUST_MOTION_VERTICAL_SCALE }
      shader.uniforms.uDustSpeed = { value: DUST_MOTION_SPEED }

      shader.vertexShader = `
attribute vec3 motionDir;
attribute float motionPhase;
uniform float uTime;
uniform float uMotion;
uniform float uDustAmplitude;
uniform float uDustVerticalScale;
uniform float uDustSpeed;
${shader.vertexShader}
`

      shader.vertexShader = shader.vertexShader.replace(
        '#include <begin_vertex>',
        `
#include <begin_vertex>
float motionTimeA = uTime * uDustSpeed + motionPhase;
float motionTimeB = uTime * (uDustSpeed * 0.67) + (motionPhase * 1.91);
vec3 driftPrimary = motionDir * sin(motionTimeA);
vec3 driftSecondary = vec3(motionDir.y, -motionDir.z, motionDir.x) * cos(motionTimeB);
vec3 drift = (driftPrimary + driftSecondary * 0.65) * uDustAmplitude;
drift.y *= uDustVerticalScale;
transformed += drift * uMotion;
`
      )

      ;(material.userData as { shader?: any }).shader = shader
    }
    material.needsUpdate = true

    const cloud = new THREE.Points(geometry, material)
    const maxPoints = geometry.getAttribute('position').count
    cloud.userData = {
      ...cloud.userData,
      maxPoints,
      drawCount: maxPoints,
    }
    geometry.setDrawRange(0, maxPoints)
    cloudGroup.add(cloud)
    pointClouds[index] = cloud
  }

  resizeScene()
  pointerState.lastMoveAt = performance.now()
  webglReady.value = true
  animationFrame = window.requestAnimationFrame(tick)
}

const cleanupScene = () => {
  disposed = true

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

  for (let index = 0; index < pointClouds.length; index += 1) {
    const cloud = pointClouds[index]
    if (!cloud) continue
    cloud.geometry.dispose()
    cloud.material.dispose()
    cloudGroup.remove(cloud)
    pointClouds[index] = null
  }
  pointClouds.length = 0

  if (renderer) {
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
      aria-label="Interactive anamorphic point cloud of projects"
    ></div>

    <div class="hero-ui" v-if="projects.length && webglReady">
      <button class="hero-open" type="button" @click="openActiveProject">
        {{ activeProject?.title }}
      </button>
    </div>

    <div class="hero-fallback" v-else-if="projects.length">
      <button class="hero-open" type="button" @click="openActiveProject">
        {{ activeProject?.title }}
      </button>
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
  background:
    radial-gradient(circle at 50% 45%, rgba(255, 255, 255, 0.08), rgba(255, 255, 255, 0) 42%),
    radial-gradient(circle at 12% 10%, rgba(120, 160, 255, 0.14), rgba(120, 160, 255, 0) 48%),
    radial-gradient(circle at 84% 84%, rgba(255, 210, 140, 0.12), rgba(255, 210, 140, 0) 46%),
    var(--site-bg);
}

.hero-atmosphere {
  position: absolute;
  inset: -8% -12%;
  background:
    linear-gradient(to top, rgba(0, 0, 0, 0.42), rgba(0, 0, 0, 0.1) 34%, rgba(0, 0, 0, 0.5)),
    radial-gradient(circle at 50% 62%, rgba(255, 255, 255, 0.06), transparent 62%);
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

.hero-ui {
  position: absolute;
  left: 50%;
  bottom: 1.8rem;
  transform: translateX(-50%);
  z-index: 3;
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 0.45rem;
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

.hero-hint {
  font-size: 0.67rem;
  letter-spacing: 0.14em;
  text-transform: uppercase;
  color: rgba(255, 255, 255, 0.66);
  user-select: none;
}

.hero-fallback {
  position: absolute;
  inset: 0;
  z-index: 2;
  display: flex;
  align-items: flex-end;
  justify-content: center;
  padding-bottom: 1.8rem;
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

.light-mode .hero-hint {
  color: rgba(0, 0, 0, 0.64);
}

@media (max-width: 768px) {
  .home-hero {
    height: 68vh;
    min-height: 460px;
  }

  .hero-open {
    font-size: 0.74rem;
    letter-spacing: 0.06em;
    padding: 0.62rem 0.88rem;
  }

  .hero-hint {
    font-size: 0.62rem;
  }
}
</style>
