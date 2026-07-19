const LERP_FACTOR = 0.1
const WHEEL_MULTIPLIER = 1
const LINE_HEIGHT = 16
const MAX_WHEEL_DELTA = 240
const SETTLE_THRESHOLD = 0.15
const FRAME_DURATION = 1000 / 60

const WHEEL_CONTROL_SELECTOR = [
  'input',
  'textarea',
  'select',
  'option',
  'audio',
  'video',
  '[contenteditable]:not([contenteditable="false"])',
  '[data-lenis-prevent]',
  '[data-lenis-prevent-wheel]',
  '[data-smooth-scroll-prevent]',
  '[role="combobox"]',
  '[role="grid"]',
  '[role="listbox"]',
  '[role="menu"]',
  '[role="slider"]',
  '[role="spinbutton"]',
  '[role="tree"]'
].join(',')

const NATIVE_SCROLL_KEYS = new Set([
  'ArrowDown',
  'ArrowUp',
  'End',
  'Home',
  'PageDown',
  'PageUp',
  ' '
])

const clamp = (value: number, min: number, max: number) => {
  return Math.min(max, Math.max(min, value))
}

const ownsWheelInput = (target: EventTarget | null) => {
  return target instanceof Element && Boolean(target.closest(WHEEL_CONTROL_SELECTOR))
}

const getMaxScroll = () => {
  return Math.max(0, document.documentElement.scrollHeight - window.innerHeight)
}

const normalizeWheelDistance = (event: WheelEvent) => {
  let distance = event.deltaY

  if (event.deltaMode === WheelEvent.DOM_DELTA_LINE) {
    distance *= LINE_HEIGHT
  } else if (event.deltaMode === WheelEvent.DOM_DELTA_PAGE) {
    distance *= window.innerHeight * 0.9
  }

  distance *= WHEEL_MULTIPLIER
  return Math.sign(distance) * Math.min(Math.abs(distance), MAX_WHEEL_DELTA)
}

const nestedScrollerCanConsume = (target: EventTarget | null, distance: number) => {
  let element = target instanceof Element ? target : null

  while (element && element !== document.body && element !== document.documentElement) {
    if (element instanceof HTMLElement) {
      const style = window.getComputedStyle(element)
      const containsOverscroll = style.overscrollBehaviorY === 'contain' || style.overscrollBehaviorY === 'none'
      const scrollable = /^(auto|scroll|overlay)$/.test(style.overflowY)

      if (containsOverscroll) return true
      if (scrollable && element.scrollHeight > element.clientHeight + 1) {
        const maxScrollTop = element.scrollHeight - element.clientHeight
        const hasRoom = distance < 0 ? element.scrollTop > 1 : element.scrollTop < maxScrollTop - 1
        if (hasRoom) return true
      }
    }

    element = element.parentElement
  }

  return false
}

/**
 * A small, dependency-free smooth-scroll loop inspired by Lenis' target and
 * lerp model. Wheel input updates one target position; requestAnimationFrame
 * continuously interpolates the page toward it.
 */
export const installSmoothWheelScroll = () => {
  if (
    typeof window === 'undefined' ||
    typeof document === 'undefined' ||
    typeof window.requestAnimationFrame !== 'function' ||
    typeof window.cancelAnimationFrame !== 'function' ||
    typeof window.scrollTo !== 'function'
  ) {
    return () => undefined
  }

  const reducedMotion = window.matchMedia('(prefers-reduced-motion: reduce)')
  let animationFrame = 0
  let lastFrameTime = 0
  let animatedScroll = window.scrollY
  let targetScroll = window.scrollY
  let customScrollAvailable = true

  const syncWithPage = () => {
    animatedScroll = window.scrollY
    targetScroll = window.scrollY
    lastFrameTime = 0
  }

  const stopAnimation = (sync = true) => {
    if (animationFrame) window.cancelAnimationFrame(animationFrame)
    animationFrame = 0
    if (sync) syncWithPage()
  }

  const scrollPage = (position: number) => {
    try {
      window.scrollTo(0, position)
      return true
    } catch {
      customScrollAvailable = false
      stopAnimation()
      return false
    }
  }

  const tick = (timestamp: number) => {
    animationFrame = 0

    if (
      !customScrollAvailable ||
      reducedMotion.matches ||
      document.hidden ||
      document.querySelector('[aria-modal="true"]')
    ) {
      stopAnimation()
      return
    }

    const elapsed = lastFrameTime
      ? Math.min(timestamp - lastFrameTime, FRAME_DURATION * 3)
      : FRAME_DURATION
    lastFrameTime = timestamp

    // Keep the same feel across refresh rates: 0.1 is the amount interpolated
    // during one 60 Hz frame, then converted for the actual elapsed time.
    const frameLerp = 1 - Math.pow(1 - LERP_FACTOR, elapsed / FRAME_DURATION)
    animatedScroll += (targetScroll - animatedScroll) * frameLerp

    if (Math.abs(targetScroll - animatedScroll) <= SETTLE_THRESHOLD) {
      animatedScroll = targetScroll
      scrollPage(animatedScroll)
      stopAnimation(false)
      return
    }

    if (!scrollPage(animatedScroll)) return
    animationFrame = window.requestAnimationFrame(tick)
  }

  const startAnimation = () => {
    if (!animationFrame) animationFrame = window.requestAnimationFrame(tick)
  }

  const shouldUseCustomScroll = (event: WheelEvent) => {
    return (
      customScrollAvailable &&
      !reducedMotion.matches &&
      !event.defaultPrevented &&
      !event.altKey &&
      !event.ctrlKey &&
      !event.metaKey &&
      !event.shiftKey &&
      !ownsWheelInput(event.target) &&
      !document.querySelector('[aria-modal="true"]') &&
      !nestedScrollerCanConsume(event.target, event.deltaY)
    )
  }

  const onWheel = (event: WheelEvent) => {
    if (!event.deltaY || !shouldUseCustomScroll(event)) return

    // Probe before taking over. If scrolling is unavailable, the event stays
    // native and all future wheel input continues to use the browser default.
    if (!scrollPage(window.scrollY)) return
    event.preventDefault()

    if (!animationFrame) syncWithPage()
    targetScroll = clamp(
      targetScroll + normalizeWheelDistance(event),
      0,
      getMaxScroll()
    )
    startAnimation()
  }

  const onPageScroll = () => {
    if (!animationFrame) {
      syncWithPage()
      return
    }

    // Scrollbar dragging, anchors, browser restoration, or another control
    // should take ownership rather than being pulled back to an old target.
    if (Math.abs(window.scrollY - animatedScroll) > 2) stopAnimation()
  }

  const onNavigationKey = (event: KeyboardEvent) => {
    if (NATIVE_SCROLL_KEYS.has(event.key)) stopAnimation()
  }

  const onResize = () => {
    targetScroll = clamp(targetScroll, 0, getMaxScroll())
    animatedScroll = clamp(animatedScroll, 0, getMaxScroll())
  }

  const onVisibilityChange = () => {
    if (document.hidden) stopAnimation()
  }

  const onMotionPreferenceChange = () => {
    if (reducedMotion.matches) stopAnimation()
  }

  const cancelAnimation = () => stopAnimation()

  window.addEventListener('wheel', onWheel, { passive: false })
  window.addEventListener('scroll', onPageScroll, { passive: true })
  window.addEventListener('keydown', onNavigationKey)
  window.addEventListener('pointerdown', cancelAnimation)
  window.addEventListener('blur', cancelAnimation)
  window.addEventListener('resize', onResize, { passive: true })
  document.addEventListener('visibilitychange', onVisibilityChange)
  reducedMotion.addEventListener('change', onMotionPreferenceChange)

  return () => {
    stopAnimation()
    window.removeEventListener('wheel', onWheel)
    window.removeEventListener('scroll', onPageScroll)
    window.removeEventListener('keydown', onNavigationKey)
    window.removeEventListener('pointerdown', cancelAnimation)
    window.removeEventListener('blur', cancelAnimation)
    window.removeEventListener('resize', onResize)
    document.removeEventListener('visibilitychange', onVisibilityChange)
    reducedMotion.removeEventListener('change', onMotionPreferenceChange)
  }
}
