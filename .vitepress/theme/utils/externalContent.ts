import { computed, reactive, ref } from 'vue'

// Consent applies to one mounted viewer and is never persisted in the browser.
const activeViewers = reactive(new Set<string>())
export const externalContentResetVersion = ref(0)
export const activeExternalContentCount = computed(() => activeViewers.size)

export function setExternalContentActive(id: string, active: boolean) {
  if (active) activeViewers.add(id)
  else activeViewers.delete(id)
}

export function disableExternalContent() {
  externalContentResetVersion.value += 1
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
