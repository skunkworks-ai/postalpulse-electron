import { contextBridge, ipcRenderer } from 'electron'
import { electronAPI } from '@electron-toolkit/preload'

// Custom APIs for renderer
const api = {
  getConfig: async () => {
    try {
      return await ipcRenderer.invoke('config-get')
    } catch (e) {
      console.error('getConfig error', e)
      return null
    }
  },
  setConfig: async (newConfig: unknown) => {
    try {
      return await ipcRenderer.invoke('config-set', newConfig)
    } catch (e) {
      console.error('setConfig error', e)
      return null
    }
  },
  googleMapsGet: (opts: { url: string; method?: string; headers?: Record<string, string>; body?: string }): Promise<unknown> =>
    ipcRenderer.invoke('google-maps-get', opts),
  logTransaction: (record: unknown): Promise<unknown> => ipcRenderer.invoke('log-transaction', record)
}

// Use `contextBridge` APIs to expose Electron APIs to
// renderer only if context isolation is enabled, otherwise
// just add to the DOM global.
if (process.contextIsolated) {
  try {
    contextBridge.exposeInMainWorld('electron', electronAPI)
    contextBridge.exposeInMainWorld('api', api)
  } catch (error) {
    console.error(error)
  }
} else {
  // @ts-ignore (define in dts)
  window.electron = electronAPI
  // @ts-ignore (define in dts)
  window.api = api
}
