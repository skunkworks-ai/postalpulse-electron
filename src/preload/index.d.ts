import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getConfig: () => Promise<unknown>
      setConfig: (config: unknown) => Promise<unknown>
      googleMapsGet: (opts: { url: string; method?: string; headers?: Record<string, string>; body?: string }) => Promise<unknown>
    }
  }
}
