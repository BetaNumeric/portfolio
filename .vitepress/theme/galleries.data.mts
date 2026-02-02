import { readdirSync, existsSync } from 'fs'
import { join } from 'path'

export interface GalleryIndex {
  [projectSlug: string]: string[]
}

declare const data: GalleryIndex
export { data }

export default {
  watch: ['public/projects/**/gallery/**'],
  load(): GalleryIndex {
    const galleriesIndex: GalleryIndex = {}
    const projectsPath = join(process.cwd(), 'public', 'projects')
    
    console.log('Scanning galleries in:', projectsPath) // Debug log

    try {
      if (!existsSync(projectsPath)) {
        console.warn('Projects directory not found:', projectsPath)
        return {}
      }

      const projectDirs = readdirSync(projectsPath, { withFileTypes: true })
        .filter((dirent) => dirent.isDirectory() && !dirent.name.startsWith('_'))
      
      for (const projectDir of projectDirs) {
        const galleryPath = join(projectsPath, projectDir.name, 'gallery')
        
        if (existsSync(galleryPath)) {
          try {
            const files = readdirSync(galleryPath)
              .filter((file) => /\.(jpg|jpeg|png|gif|webp)$/i.test(file))
              .sort()
            
            if (files.length > 0) {
              galleriesIndex[projectDir.name] = files.map(
                (file) => `/projects/${projectDir.name}/gallery/${file}`
              )
              console.log(`Found gallery for ${projectDir.name}: ${files.length} images`)
            }
          } catch (e) {
            console.error(`Error reading gallery for ${projectDir.name}:`, e)
          }
        }
      }
    } catch (e) {
      console.error('Error scanning galleries:', e)
    }
    
    return galleriesIndex
  }
}
