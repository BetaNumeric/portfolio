const clamp = (value: number, min: number, max: number) => {
  return Math.min(Math.max(value, min), max)
}

const lerp = (from: number, to: number, alpha: number) => {
  return from + (to - from) * alpha
}

const easeInOutCubic = (value: number) => {
  return value < 0.5 ? 4 * value * value * value : 1 - Math.pow(-2 * value + 2, 3) / 2
}

type ProjectOpacityOptions = {
  minOpacity: number
  maxOpacity: number
  fadeStart: number
  fadeEnd: number
  focusSoftSelection: number
  focusBlendExponent: number
}

export const computeProjectOpacities = (
  alignmentScores: number[],
  {
    minOpacity,
    maxOpacity,
    fadeStart,
    fadeEnd,
    focusSoftSelection,
    focusBlendExponent,
  }: ProjectOpacityOptions
) => {
  if (!alignmentScores.length) return [] as number[]

  const maxAlignmentScore = alignmentScores.reduce((best, value) => {
    return Math.max(best, clamp(value ?? 0, 0, 1))
  }, 0)
  const fadeProgress = easeInOutCubic(
    clamp((maxAlignmentScore - fadeStart) / Math.max(fadeEnd - fadeStart, 0.0001), 0, 1)
  )
  const backgroundOpacity = lerp(maxOpacity, minOpacity, fadeProgress)
  const neutralFocusWeight = 1 / alignmentScores.length

  let totalFocusWeight = 0
  const focusWeights = alignmentScores.map((score) => {
    const weight = Math.exp((clamp(score ?? 0, 0, 1) - maxAlignmentScore) * focusSoftSelection)
    totalFocusWeight += weight
    return weight
  })

  return alignmentScores.map((_, index) => {
    const normalizedFocusWeight = totalFocusWeight > 0 ? focusWeights[index] / totalFocusWeight : 0
    const focusBlend = easeInOutCubic(
      Math.pow(
        clamp(
          (normalizedFocusWeight - neutralFocusWeight) / Math.max(1 - neutralFocusWeight, 0.0001),
          0,
          1
        ),
        focusBlendExponent
      )
    )

    return lerp(backgroundOpacity, maxOpacity, fadeProgress * focusBlend)
  })
}
