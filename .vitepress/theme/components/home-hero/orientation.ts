import * as THREE from 'three'

const TAU = Math.PI * 2

export type ProjectOrientation = {
  yaw: number
  pitch: number
  axis: THREE.Vector3
}

export type SphereLayoutMode = 'horizontal' | 'vertical' | 'spiral' | 'random'

export type SphereLayoutOptions = {
  mode?: SphereLayoutMode
  pitchAmplitude?: number
  yawAmplitude?: number
  turns?: number
  phase?: number
  randomSeed?: number
}

export type OrientationTarget = {
  yaw: number
  pitch: number
}

export type SnapTarget = OrientationTarget & {
  index: number
  yawDelta: number
  pitchDelta: number
  angle: number
}

const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

const getWrappedTurnTarget = (target: number, from: number) => {
  return target + Math.round((from - target) / TAU) * TAU
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

export const getLocalViewDirectionForRotation = (yaw: number, pitch: number, target = new THREE.Vector3()) => {
  const rotation = new THREE.Euler(pitch, yaw, 0)
  const quaternion = new THREE.Quaternion().setFromEuler(rotation)
  return target.set(0, 0, 1).applyQuaternion(quaternion.invert())
}

export const buildProjectOrientations = (projectCount: number, options: SphereLayoutOptions = {}) => {
  if (projectCount <= 0) return [] as ProjectOrientation[]

  const mode = options.mode ?? 'horizontal'
  const pitchAmplitude = options.pitchAmplitude ?? 0
  const yawAmplitude = options.yawAmplitude ?? 0
  const turns = options.turns ?? 1
  const phase = options.phase ?? 0
  const random = createSeededRandom(options.randomSeed ?? 0x51f15e)
  const axisStep = TAU / projectCount

  return Array.from({ length: projectCount }, (_, index) => {
    const angle = phase + axisStep * index * turns
    let yaw = 0
    let pitch = 0

    if (mode === 'vertical') {
      yaw = Math.sin(angle) * yawAmplitude
      pitch = -angle
    } else if (mode === 'spiral') {
      const progress = (index + 0.5) / projectCount
      const normalizedLatitude = 1 - progress * 2
      const latitudeCoverage = clamp(Math.abs(pitchAmplitude), 0, Math.PI / 2)
      yaw = -phase - (TAU * turns * index) / Math.max(projectCount - 1, 1)
      pitch = Math.asin(normalizedLatitude) * (latitudeCoverage / (Math.PI / 2))
    } else if (mode === 'random') {
      const latitudeCoverage = clamp(Math.abs(pitchAmplitude), 0, Math.PI / 2)
      yaw = phase + (random() - 0.5) * TAU
      pitch = Math.asin(random() * 2 - 1) * (latitudeCoverage / (Math.PI / 2))
    } else {
      yaw = -angle
      pitch = Math.sin(angle) * pitchAmplitude
    }

    return {
      yaw,
      pitch,
      axis: getLocalViewDirectionForRotation(yaw, pitch).clone(),
    } satisfies ProjectOrientation
  })
}

export const getNearestOrientationForProject = (
  orientation: ProjectOrientation,
  fromYaw: number,
  fromPitch: number
) => {
  return {
    yaw: getWrappedTurnTarget(orientation.yaw, fromYaw),
    pitch: getWrappedTurnTarget(orientation.pitch, fromPitch),
  } satisfies OrientationTarget
}

export const getNearestSnapTarget = (
  orientations: ProjectOrientation[],
  currentYaw: number,
  currentPitch: number
) => {
  if (!orientations.length) {
    return {
      index: 0,
      yaw: currentYaw,
      pitch: currentPitch,
      yawDelta: 0,
      pitchDelta: 0,
      angle: Number.POSITIVE_INFINITY,
    } satisfies SnapTarget
  }

  const viewDirection = getLocalViewDirectionForRotation(currentYaw, currentPitch)
  let nearestIndex = 0
  let nearestAngle = Number.POSITIVE_INFINITY

  for (let index = 0; index < orientations.length; index += 1) {
    const angle = Math.acos(clamp(orientations[index].axis.dot(viewDirection), -1, 1))
    if (angle < nearestAngle) {
      nearestAngle = angle
      nearestIndex = index
    }
  }

  const nearestOrientation = getNearestOrientationForProject(orientations[nearestIndex], currentYaw, currentPitch)

  return {
    index: nearestIndex,
    yaw: nearestOrientation.yaw,
    pitch: nearestOrientation.pitch,
    yawDelta: nearestOrientation.yaw - currentYaw,
    pitchDelta: nearestOrientation.pitch - currentPitch,
    angle: nearestAngle,
  } satisfies SnapTarget
}
