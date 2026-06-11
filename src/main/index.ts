import { app, shell, BrowserWindow, ipcMain, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { logTransaction, type TransactionRecord } from './transactionLogger'
import icon from '../../resources/icon.png?asset'

const Store = require('electron-store') as any

type ConfigState = Record<string, unknown>

// Load default config values from shared config.json
import configDefaults from '../../src/renderer/src/features/config/config.json'

const configStore: any = new Store({ name: 'postalpulse-config', defaults: configDefaults })

function createWindow(): void {
  // Create the browser window.
  const mainWindow = new BrowserWindow({
    width: 1280,
    height: 800,
    show: false,
    autoHideMenuBar: true,
    icon,
    webPreferences: {
      preload: join(__dirname, '../preload/index.js'),
      sandbox: false
    },
    // Kiosk mode settings
    fullscreen: false,
    kiosk: false,
    frame: true,
    resizable: true
  })

  mainWindow.on('ready-to-show', () => {
    mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(process.env['ELECTRON_RENDERER_URL'])
  } else {
    mainWindow.loadFile(join(__dirname, '../renderer/index.html'))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId('com.postalpulse.express')

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // IPC test
  ipcMain.on('ping', () => console.log('pong'))

  // Config persistence via electron-store
  ipcMain.handle('config-get', () => {
    return configStore.store
  })

  ipcMain.handle('config-set', (_, newConfig: Partial<ConfigState>) => {
    const merged = { ...configStore.store, ...newConfig }
    configStore.set(merged)
    return configStore.store
  })

  // Proxy Google Maps API requests through the main process to avoid
  // CORS / CSP restrictions in both dev and production builds.
  type MapsRequestOpts = {
    url: string
    method?: string
    headers?: Record<string, string>
    body?: string
  }
  ipcMain.handle('google-maps-get', (_event, opts: MapsRequestOpts): Promise<unknown> => {
    return new Promise((resolve, reject) => {
      const { url, method = 'GET', headers = {}, body } = opts
      const request = net.request({ url, method })
      for (const [key, val] of Object.entries(headers)) {
        request.setHeader(key, val)
      }
      let responseBody = ''
      request.on('response', (response) => {
        response.on('data', (chunk) => {
          responseBody += chunk.toString()
        })
        response.on('end', () => {
          try {
            resolve(JSON.parse(responseBody))
          } catch {
            reject(new Error('Failed to parse Google Maps response'))
          }
        })
      })
      request.on('error', (err) => reject(err))
      if (body) request.write(body)
      request.end()
    })
  })

  // Transaction logging
  ipcMain.handle('log-transaction', (_event, record: TransactionRecord) => {
    logTransaction(record)
    return { success: true }
  })

  createWindow()

  app.on('activate', function () {
    // On macOS it's common to re-create a window in the app when the
    // dock icon is clicked and there are no other windows open.
    if (BrowserWindow.getAllWindows().length === 0) createWindow()
  })
})

// Quit when all windows are closed, except on macOS. There, it's common
// for applications and their menu bar to stay active until the user quits
// explicitly with Cmd + Q.
app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

// In this file you can include the rest of your app's specific main process
// code. You can also put them in separate files and require them here.
