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
    // If a matching script tag exists but isn't marked loaded yet, attach listeners.
    if (existing) {
      existing.addEventListener('load', () => resolve(), { once: true })
      existing.addEventListener(
        'error',
        () => reject(new Error(`Failed to load script: ${src}`)),
        { once: true }
      )
      return
    }

    const el = document.createElement('script')
    el.src = src
    el.async = true
    el.dataset.scriptOnce = key

    el.addEventListener(
      'load',
      () => {
        el.dataset.loaded = 'true'
        resolve()
      },
      { once: true }
    )
    el.addEventListener(
      'error',
      () => reject(new Error(`Failed to load script: ${src}`)),
      { once: true }
    )

    document.head.appendChild(el)
  })

  pendingLoads.set(src, promise)
  // If this fails, allow retries.
  promise.catch(() => pendingLoads.delete(src))

  return promise
}

