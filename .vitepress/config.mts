import { defineConfig } from 'vitepress'

// https://vitepress.dev/reference/site-config
export default defineConfig({
  base: '/portfolio/',
  title: "Tim Paulawitz",
  description: "Artist & creative technologist focusing on generative visuals, installations, and experimental media.",
  themeConfig: {
    // https://vitepress.dev/reference/default-theme-config
    nav: [
      { text: 'Projects', link: '/#projects' },
      { text: 'Contact', link: '/#contact' },
      { text: 'About Me', link: '/#about' }
    ],

    socialLinks: [
      { icon: 'vimeo', link: 'https://vimeo.com/eydeet' },
      { icon: 'youtube', link: 'https://www.youtube.com/user/DerEydeet' },
      { icon: 'instagram', link: 'https://instagram.com/eydeet' },
      { icon: 'github', link: 'https://github.com/BetaNumeric' },
      { icon: 'linkedin', link: 'https://linkedin.com/in/timredlich' },
      { icon: 'mail', link: 'mailto:tim.red@web.de' }
    ],
    footerTitle: "Tim Redlich | Portfolio",
    footerLinks: [
      { text: "Recursive Emergence", link: "/projects/recursive-emergence" },
      { text: "Time Scale", link: "/projects/time" },
      { text: "Breathing Trees", link: "/projects/breathing-trees" },
      { text: "Seeing Water", link: "/projects/seeing-water" }
    ]
  }
})
