import { createContentLoader } from 'vitepress'

export interface Project {
  title: string
  year: string | number
  description: string
  link: string
  image: string
  preview?: string
}

declare const data: Project[]
export { data }

export default createContentLoader('projects/*/*.md', {
  transform(raw): Project[] {
    return raw
      .filter(({ url, frontmatter }) => {
        if (url.includes('/_template/')) return false
        return frontmatter?.title && frontmatter?.heroImage
      })
      .map(({ url, frontmatter }) => ({
        title: frontmatter.title,
        year: frontmatter.year,
        description: frontmatter.description,
        link: url,
        image: frontmatter.heroImage,
        preview: frontmatter.previewMedia ?? frontmatter.preview,
      }))
      .sort((a, b) => {
         const yearA = parseInt(String(a.year || 0))
         const yearB = parseInt(String(b.year || 0))
         return yearB - yearA
      })
  }
})
