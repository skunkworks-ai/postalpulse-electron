/// <reference types="vite/client" />

interface Window {
  api: {
    getConfig: () => Promise<unknown>
    setConfig: (config: unknown) => Promise<unknown>
    googleMapsGet: (opts: { url: string; method?: string; headers?: Record<string, string>; body?: string }) => Promise<unknown>
  }
}

declare module '*.svg' {
  const src: string
  export default src
}

declare module '*.mp3' {
  const src: string
  export default src
}
