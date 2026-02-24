import { defineConfig } from 'vitepress'
// @ts-ignore: Node.js built-in 'fs' may not have type declarations in this environment (used at build time)
import fs from 'fs'
// @ts-ignore: Node.js built-in 'path' may not have type declarations in this environment (used at build time)
import path from 'path'

declare const process: any
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
  title: "Tim",
  ignoreDeadLinks: true,
  description: "Artist & creative technologist focusing on generative visuals, installations, and experimental media.",
  vite: {
    plugins: [
      {
        name: 'ignore-missing-public-assets',
        resolveId(id) {
          // If the import path starts with /projects/, check if it truly exists
          if (id.startsWith('/projects/')) {
            const publicFile = path.join(process.cwd(), 'public', id)
            if (!fs.existsSync(publicFile)) {
              // Redirect to a virtual ID handled by load()
              return '\0missing-asset:' + id
            }
          }
        },
        load(id) {
          if (id.startsWith('\0missing-asset:')) {
             const realPath = id.slice('\0missing-asset:'.length)
             // Return the path as a string, so the img tag gets the src string
             return `export default "${realPath}"`
          }
        }
      }
    ]
  },
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
      { icon: 'vimeo', link: 'https://vimeo.com/eydeet' },
      { icon: 'youtube', link: 'https://www.youtube.com/user/DerEydeet' },
      { icon: 'instagram', link: 'https://instagram.com/eydeet' },
      { icon: 'github', link: 'https://github.com/BetaNumeric' },
      { icon: 'linkedin', link: 'https://linkedin.com/in/timredlich' },
      { icon: 'mail', link: 'mailto:tim.red@web.de' }
    ],
    footer: {
      message: "Tim Redlich | Portfolio"
    },
    footerLinks: [
      { text: "Recursive Emergence", link: "/projects/recursive-emergence" },
      { text: "Time Scale", link: "/projects/time" },
      { text: "Breathing Trees", link: "/projects/breathing-trees" },
      { text: "Seeing Water", link: "/projects/seeing-water" }
    ]
  } as any,
})
