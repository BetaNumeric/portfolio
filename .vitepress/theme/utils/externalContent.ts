import { computed, reactive, ref } from 'vue'

// Individual choices stay with the viewer; an explicit all-content choice lasts
// for the current tab's session and is restored after the app has mounted.
const ALL_CONTENT_CONSENT_KEY = 'external-content-consent'
const activeViewers = reactive(new Set<string>())
export const allExternalContentAllowed = ref(false)
export const externalContentConsentVersion = ref(0)
export const activeExternalContentCount = computed(() => activeViewers.size)

export function restoreExternalContentConsent() {
  try {
    allExternalContentAllowed.value = sessionStorage.getItem(ALL_CONTENT_CONSENT_KEY) === 'all'
  } catch { /* Consent still works in memory when browser storage is unavailable. */ }
}

export function allowAllExternalContent() {
  allExternalContentAllowed.value = true
  // Re-enable any viewers that were individually unloaded since the last choice.
  externalContentConsentVersion.value += 1
  try { sessionStorage.setItem(ALL_CONTENT_CONSENT_KEY, 'all') } catch {}
}

export function setExternalContentActive(id: string, active: boolean) {
  if (active) activeViewers.add(id)
  else activeViewers.delete(id)
}

export function disableExternalContent() {
  allExternalContentAllowed.value = false
  externalContentConsentVersion.value += 1
  try { sessionStorage.removeItem(ALL_CONTENT_CONSENT_KEY) } catch {}
}

export function cleanExternalUrl(source: string) {
  return source.replace(/\s+/g, '')
}

export function getExternalProvider(source: string) {
  let host = ''
  try {
    host = new URL(cleanExternalUrl(source)).hostname.toLowerCase()
  } catch {
    return { name: 'External content', privacyUrl: '' }
  }

  const matches = (domain: string) => host === domain || host.endsWith(`.${domain}`)
  if (matches('youtube.com') || matches('youtube-nocookie.com') || matches('youtu.be')) {
    return { name: 'YouTube', privacyUrl: 'https://policies.google.com/privacy' }
  }
  if (matches('vimeo.com')) return { name: 'Vimeo', privacyUrl: 'https://vimeo.com/privacy' }
  if (matches('sketchfab.com')) return { name: 'Sketchfab', privacyUrl: 'https://sketchfab.com/privacy' }
  if (matches('lumalabs.ai')) return { name: 'Luma', privacyUrl: 'https://lumalabs.ai/legal/privacy-policy' }
  if (matches('momento360.com')) return { name: 'Momento360', privacyUrl: 'https://momento360.com/ps/' }
  if (matches('metareal.com')) return { name: 'Metareal', privacyUrl: 'https://www.metareal.com/?link=privacy' }
  if (host === 'docs.google.com') return { name: 'Google Sheets', privacyUrl: 'https://policies.google.com/privacy' }
  if (matches('google.com')) return { name: 'Google Maps', privacyUrl: 'https://policies.google.com/privacy' }
  if (host === 'betanumeric.github.io') {
    return { name: 'GitHub Pages project', privacyUrl: 'https://docs.github.com/en/site-policy/privacy-policies/github-general-privacy-statement' }
  }
  return { name: host, privacyUrl: '' }
}

export function getPrivateEmbedUrl(source: string) {
  const cleanedSource = cleanExternalUrl(source)
  try {
    const url = new URL(cleanedSource)
    if (url.hostname === 'www.youtube.com' || url.hostname === 'youtube.com') {
      url.hostname = 'www.youtube-nocookie.com'
    }
    if (url.hostname === 'player.vimeo.com') url.searchParams.set('dnt', '1')
    return url.toString()
  } catch {
    return cleanedSource
  }
}
