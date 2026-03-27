import { defineConfig } from 'vitepress'
const siteBase = '/portfolio/'
const videoAssetPattern = /\.(mp4|webm|mov|m4v|ogv|ogg)(?:$|[?#])/i

const withSiteBase = (src: string) => {
  if (!src.startsWith('/') || src.startsWith('//')) return src
  if (src.startsWith(siteBase)) return src
  const normalizedBase = siteBase.endsWith('/') ? siteBase.slice(0, -1) : siteBase
  return `${normalizedBase}${src}`
}

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: siteBase,
  title: 'Tim',
  ignoreDeadLinks: false,
  description:
    'Artist & creative technologist focusing on generative visuals, installations, and experimental media.',
  markdown: {
    config(md) {
      const defaultImageRenderer = md.renderer.rules.image

      md.renderer.rules.image = (tokens, idx, options, env, self) => {
        const token = tokens[idx]
        const src = token.attrGet('src') ?? ''

        if (!videoAssetPattern.test(src)) {
          if (defaultImageRenderer) {
            return defaultImageRenderer(tokens, idx, options, env, self)
          }
          return self.renderToken(tokens, idx, options)
        }

        const altText = self.renderInlineAsText(token.children ?? [], options, env)
        const escapedAlt = md.utils.escapeHtml(altText || 'Video')
        const title = token.attrGet('title')
        const escapedTitle = title ? md.utils.escapeHtml(title) : ''
        const titleAttr = escapedTitle ? ` title="${escapedTitle}"` : ''
        const srcExpression = md.utils.escapeHtml(JSON.stringify(withSiteBase(src)))
        const srcAttr = `:src="${srcExpression}"`

        return `<video ${srcAttr} class="md-inline-video" autoplay loop muted playsinline preload="metadata" aria-label="${escapedAlt}"${titleAttr}></video>`
      }
    }
  },
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Projects', link: '/#projects' },
      { text: 'Contact', link: '/contact' },
      { text: 'About Me', link: '/about' }
    ],

    socialLinks: [
      { name: 'Vimeo', icon: 'vimeo', link: 'https://vimeo.com/eydeet' },
      { name: 'YouTube', icon: 'youtube', link: 'https://www.youtube.com/user/DerEydeet' },
      { name: 'Instagram', icon: 'instagram', link: 'https://instagram.com/eydeet' },
      { name: 'GitHub', icon: 'github', link: 'https://github.com/BetaNumeric' },
      { name: 'LinkedIn', icon: 'linkedin', link: 'https://linkedin.com/in/timredlich' },
      { name: 'Email', icon: 'mail', link: 'mailto:tim.red@web.de' }
    ]
  } as any,
})
