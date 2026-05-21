import { ElectronAPI } from '@electron-toolkit/preload'

declare global {
  interface Window {
    electron: ElectronAPI
    api: {
      getConfig: () => Promise<unknown>
      setConfig: (config: unknown) => Promise<unknown>
    }
  }
}
