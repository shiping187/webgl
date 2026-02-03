/// <reference types="vite/client" />

declare module '*.vue' {
  import type { DefineComponent } from 'vue'
  const component: DefineComponent<{}, {}, any>
  export default component
}

declare module 'highlight.js/lib/core' {
  import hljs from 'highlight.js'
  export default hljs
}

declare module 'highlight.js/lib/languages/glsl' {
  import { LanguageFn } from 'highlight.js'
  const glsl: LanguageFn
  export default glsl
}
