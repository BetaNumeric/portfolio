const ARROW_DIRECTIONS = {
  ArrowUp: -1,
  ArrowDown: 1
} as const

type ArrowScrollKey = keyof typeof ARROW_DIRECTIONS

const INITIAL_SCROLL_STEP = 24
const INITIAL_SCROLL_SPEED = 360
const MAX_SCROLL_SPEED = 720
const ACCELERATION = 14

const ARROW_KEY_CONTROL_SELECTOR = [
  'input',
  'textarea',
  'select',
  'option',
  'audio',
  'video',
  '[contenteditable]:not([contenteditable="false"])',
  '[role="combobox"]',
  '[role="grid"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="tree"]'
].join(',')

const isArrowScrollKey = (key: string): key is ArrowScrollKey => key in ARROW_DIRECTIONS

const ownsArrowKeys = (target: EventTarget | null) => {
  return target instanceof Element && Boolean(target.closest(ARROW_KEY_CONTROL_SELECTOR))
}

/**
 * Replaces the operating system's delayed ArrowUp/ArrowDown repeat with a
 * frame-driven page scroll. Returning a cleanup function keeps it safe for
 * client-side layout mounts and unmounts.
 */
export const installArrowKeyScroll = () => {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof window.requestAnimationFrame !== 'function' ||
    typeof window.cancelAnimationFrame !== 'function' ||
    typeof window.scrollBy !== 'function'
  ) {
    return () => undefined
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  const pressedKeys: ArrowScrollKey[] = []
  let animationFrame = 0
  let lastFrameTime = 0
  let velocity = 0
  let customScrollAvailable = true

  const stopAnimation = () => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame)
    animationFrame = 0
    lastFrameTime = 0
    velocity = 0
  }

  const reset = () => {
    pressedKeys.length = 0
    stopAnimation()
  }

  const scrollPage = (distance: number) => {
    try {
      window.scrollBy(0, distance)
      return true
    } catch {
      customScrollAvailable = false
      reset()
      return false
    }
  }

  const getDirection = () => {
    const activeKey = pressedKeys[pressedKeys.length - 1]
    return activeKey ? ARROW_DIRECTIONS[activeKey] : 0
  }

  const tick = (timestamp: number) => {
    animationFrame = 0
    const direction = getDirection()

    if (
      !direction ||
      !customScrollAvailable ||
      reducedMotion.matches ||
      ownsArrowKeys(document.activeElement) ||
      document.querySelector('[aria-modal="true"]')
    ) {
      reset()
      return
    }

    const elapsed = lastFrameTime
      ? Math.min((timestamp - lastFrameTime) / 1000, 0.05)
      : 1 / 60
    lastFrameTime = timestamp

    const targetVelocity = direction * MAX_SCROLL_SPEED
    velocity += (targetVelocity - velocity) * Math.min(1, elapsed * ACCELERATION)

    if (!scrollPage(velocity * elapsed)) return
    animationFrame = window.requestAnimationFrame(tick)
  }

  const startAnimation = (direction: -1 | 1) => {
    if (Math.sign(velocity) !== direction) velocity = direction * INITIAL_SCROLL_SPEED
    if (!animationFrame) animationFrame = window.requestAnimationFrame(tick)
  }

  const shouldUseCustomScroll = (event: KeyboardEvent) => {
    return (
      customScrollAvailable &&
      !reducedMotion.matches &&
      !event.defaultPrevented &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !ownsArrowKeys(event.target) &&
      !document.querySelector('[aria-modal="true"]')
    )
  }

  const onKeyDown = (event: KeyboardEvent) => {
    if (!isArrowScrollKey(event.key) || !shouldUseCustomScroll(event)) return

    // Probe before taking over the key. If scrolling is unavailable, the
    // event remains untouched and the browser keeps its native behavior.
    if (!scrollPage(0)) return
    event.preventDefault()

    // Native repeat events arrive after the OS delay; the animation loop is
    // already moving by then, so they only need to remain suppressed.
    if (pressedKeys.includes(event.key)) return

    pressedKeys.push(event.key)
    const direction = ARROW_DIRECTIONS[event.key]
    if (!scrollPage(direction * INITIAL_SCROLL_STEP)) return
    startAnimation(direction)
  }

  const onKeyUp = (event: KeyboardEvent) => {
    if (!isArrowScrollKey(event.key)) return
    const index = pressedKeys.indexOf(event.key)
    if (index === -1) return

    pressedKeys.splice(index, 1)
    const direction = getDirection()
    if (!direction) {
      stopAnimation()
      return
    }

    velocity = direction * INITIAL_SCROLL_SPEED
    lastFrameTime = 0
    if (!animationFrame) animationFrame = window.requestAnimationFrame(tick)
  }

  const onVisibilityChange = () => {
    if (document.hidden) reset()
  }

  const onMotionPreferenceChange = () => {
    if (reducedMotion.matches) reset()
  }

  window.addEventListener('keydown', onKeyDown)
  window.addEventListener('keyup', onKeyUp)
  window.addEventListener('blur', reset)
  document.addEventListener('visibilitychange', onVisibilityChange)
  reducedMotion.addEventListener('change', onMotionPreferenceChange)

  return () => {
    reset()
    window.removeEventListener('keydown', onKeyDown)
    window.removeEventListener('keyup', onKeyUp)
    window.removeEventListener('blur', reset)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    reducedMotion.removeEventListener('change', onMotionPreferenceChange)
  }
}
