import * as THREE from 'three'

const TAU = Math.PI * 2

export type ProjectOrientation = {
  yaw: number
  pitch: number
  axis: THREE.Vector3
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

export const getLocalViewDirectionForRotation = (yaw: number, pitch: number, target = new THREE.Vector3()) => {
  const rotation = new THREE.Euler(pitch, yaw, 0)
  const quaternion = new THREE.Quaternion().setFromEuler(rotation)
  return target.set(0, 0, 1).applyQuaternion(quaternion.invert())
}

export const buildProjectOrientations = (projectCount: number, pitchAmplitude: number) => {
  if (projectCount <= 0) return [] as ProjectOrientation[]

  const axisStep = TAU / projectCount
  return Array.from({ length: projectCount }, (_, index) => {
    const angle = axisStep * index
    const yaw = -angle
    const pitch = Math.sin(angle) * pitchAmplitude

    return {
      yaw,
      pitch,
      axis: getLocalViewDirectionForRotation(yaw, pitch).clone(),
    } satisfies ProjectOrientation
  })
}

export const getProjectOrientationCandidates = (
  orientation: ProjectOrientation,
  fromYaw: number,
  fromPitch: number
) => {
  return [
    {
      yaw: getWrappedTurnTarget(orientation.yaw, fromYaw),
      pitch: getWrappedTurnTarget(orientation.pitch, fromPitch),
    },
    {
      yaw: getWrappedTurnTarget(orientation.yaw + Math.PI, fromYaw),
      pitch: getWrappedTurnTarget(Math.PI - orientation.pitch, fromPitch),
    },
  ] satisfies OrientationTarget[]
}

export const pickNearestOrientationCandidate = (
  candidates: OrientationTarget[],
  fromYaw: number,
  fromPitch: number
) => {
  let bestCandidate = candidates[0]
  let bestDistance = Number.POSITIVE_INFINITY

  for (let index = 0; index < candidates.length; index += 1) {
    const candidate = candidates[index]
    const distance = Math.hypot(candidate.yaw - fromYaw, candidate.pitch - fromPitch)
    if (distance < bestDistance) {
      bestDistance = distance
      bestCandidate = candidate
    }
  }

  return bestCandidate
}

export const getNearestOrientationForProject = (
  orientation: ProjectOrientation,
  fromYaw: number,
  fromPitch: number
) => {
  return pickNearestOrientationCandidate(
    getProjectOrientationCandidates(orientation, fromYaw, fromPitch),
    fromYaw,
    fromPitch
  )
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
