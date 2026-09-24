/**
 * Minimal "load external script once" helper for ClientOnly components.
 * Uses a data attribute marker so SPA navigations don't duplicate scripts.
 */
const pendingLoads = new Map<string, Promise<void>>()

export function loadScriptOnce(src: string): Promise<void> {
  if (typeof document === 'undefined') return Promise.resolve()

  const key = encodeURIComponent(src)
  const selector = `script[data-script-once="${key}"]`
  const existing = document.querySelector(selector) as HTMLScriptElement | null

  if (existing?.dataset.loaded === 'true') return Promise.resolve()
  if (pendingLoads.has(src)) return pendingLoads.get(src)!

  const promise = new Promise<void>((resolve, reject) => {
    const el = existing ?? document.createElement('script')
    if (!existing) {
      el.src = src
      el.async = true
      el.dataset.scriptOnce = key
    }

    const onLoad = () => {
      el.removeEventListener('error', onError)
      el.dataset.loaded = 'true'
      resolve()
    }
    const onError = () => {
      el.removeEventListener('load', onLoad)
      // A failed element will never emit another load event. Remove it so the
      // next request creates a fresh script instead of waiting indefinitely.
      el.remove()
      reject(new Error(`Failed to load script: ${src}`))
    }
    el.addEventListener('load', onLoad, { once: true })
    el.addEventListener('error', onError, { once: true })

    if (!existing) document.head.appendChild(el)
  })

  pendingLoads.set(src, promise)
  // If this fails, allow retries.
  promise.catch(() => pendingLoads.delete(src))

  return promise
}
