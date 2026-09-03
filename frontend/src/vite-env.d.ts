/// <reference types="vite/client" />

// Declares the custom environment variables so `import.meta.env.VITE_*` is typed.
interface ImportMetaEnv {
  readonly VITE_API_BASE_URL?: string
  readonly VITE_WS_URL?: string
}

interface ImportMeta {
  readonly env: ImportMetaEnv
}
