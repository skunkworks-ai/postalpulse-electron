import { app, shell, BrowserWindow, ipcMain, net } from 'electron'
import { join } from 'path'
import { electronApp, optimizer, is } from '@electron-toolkit/utils'
import { logTransaction, type TransactionRecord } from './transactionLogger'
import { startWebServer } from './webServer'
import icon from '../../resources/icon.png?asset'
import { mkdirSync, writeFileSync } from 'fs'

const Store = require('electron-store') as any

type ConfigState = Record<string, unknown>

// Load default config values from shared config.json
import configDefaults from '../../src/renderer/src/features/config/config.json'

const getAppVariant = (): 'booking' | 'lodgement' => {
  const envVariant = (process.env.APP_VARIANT ?? '').toLowerCase()
  if (envVariant === 'lodgement') return 'lodgement'
  if (envVariant === 'booking') return 'booking'

  const appName = app.getName().toLowerCase()
  return appName.includes('lodgement') ? 'lodgement' : 'booking'
}

const appVariant = getAppVariant()

if (appVariant === 'lodgement') {
  app.setName('MeldPOST Lodgement')
} else {
  app.setName('MeldPOST Booking')
}

const getAppUserModelId = (): string => {
  return appVariant === 'lodgement' ? 'com.meldcx.lodgement' : 'com.meldcx.booking'
}

const configStore: any = new Store({
  name: `${appVariant}-config`,
  defaults: configDefaults
})

const rendererEntryFile = appVariant === 'lodgement' ? 'index.lodgement.html' : 'index.booking.html'

const JPEG_START = Buffer.from([0xff, 0xd8])
const JPEG_END = Buffer.from([0xff, 0xd9])
const CAPTURE_TIMEOUT_MS = 10000

const PLACEHOLDER_JPEG = Buffer.from([
  0xff, 0xd8, 0xff, 0xe0, 0x00, 0x10, 0x4a, 0x46, 0x49, 0x46, 0x00, 0x01, 0x01, 0x00, 0x00, 0x01,
  0x00, 0x01, 0x00, 0x00, 0xff, 0xdb, 0x00, 0x43, 0x00, 0x08, 0x06, 0x06, 0x07, 0x06, 0x05, 0x08,
  0x07, 0x07, 0x07, 0x09, 0x09, 0x08, 0x0a, 0x0c, 0x14, 0x0d, 0x0c, 0x0b, 0x0b, 0x0c, 0x19, 0x12,
  0x13, 0x0f, 0x14, 0x1d, 0x1a, 0x1f, 0x1e, 0x1d, 0x1a, 0x1c, 0x1c, 0x20, 0x24, 0x2e, 0x27, 0x20,
  0x22, 0x2c, 0x23, 0x1c, 0x1c, 0x28, 0x37, 0x29, 0x2c, 0x30, 0x31, 0x34, 0x34, 0x34, 0x1f, 0x27,
  0x39, 0x3d, 0x38, 0x32, 0x3c, 0x2e, 0x33, 0x34, 0x32, 0xff, 0xc0, 0x00, 0x0b, 0x08, 0x00, 0x01,
  0x00, 0x01, 0x01, 0x01, 0x11, 0x00, 0xff, 0xc4, 0x00, 0x14, 0x00, 0x01, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0xff, 0xc4, 0x00, 0x14,
  0x10, 0x01, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00, 0x00,
  0x00, 0x00, 0xff, 0xda, 0x00, 0x08, 0x01, 0x01, 0x00, 0x00, 0x3f, 0x00, 0x7f, 0xff, 0xd9
])

function getCapturesDir(): string {
  return join(app.getPath('userData'), 'transaction_captures')
}

function ensureCapturesDir(): string {
  const capturesDir = getCapturesDir()
  mkdirSync(capturesDir, { recursive: true })
  return capturesDir
}

function writePlaceholderCapture(uuid: string, reason: string): { success: boolean; path?: string; error?: string } {
  try {
    const capturesDir = ensureCapturesDir()
    const filePath = join(capturesDir, `${uuid}.jpg`)
    writeFileSync(filePath, PLACEHOLDER_JPEG)
    return { success: false, path: filePath, error: reason }
  } catch (err) {
    return { success: false, error: `${reason}; also failed to create placeholder: ${err}` }
  }
}

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
    // mainWindow.maximize()
    mainWindow.show()
  })

  mainWindow.webContents.setWindowOpenHandler((details) => {
    shell.openExternal(details.url)
    return { action: 'deny' }
  })

  // HMR for renderer base on electron-vite cli.
  // Load the remote URL for development or the local html file for production.
  if (is.dev && process.env['ELECTRON_RENDERER_URL']) {
    mainWindow.loadURL(`${process.env['ELECTRON_RENDERER_URL']}/${rendererEntryFile}`)
  } else {
    mainWindow.loadFile(join(__dirname, `../renderer/${rendererEntryFile}`))
  }
}

// This method will be called when Electron has finished
// initialization and is ready to create browser windows.
// Some APIs can only be used after this event occurs.
app.whenReady().then(() => {
  // Set app user model id for windows
  electronApp.setAppUserModelId(getAppUserModelId())

  // Ensure capture directory exists on first install/startup
  try {
    ensureCapturesDir()
  } catch (err) {
    console.error('[Capture] Failed to initialize capture directory:', err)
  }

  // Default open or close DevTools by F12 in development
  // and ignore CommandOrControl + R in production.
  // see https://github.com/alex8088/electron-toolkit/tree/master/packages/utils
  app.on('browser-window-created', (_, window) => {
    optimizer.watchWindowShortcuts(window)
  })

  // Start the transaction viewer web server for the booking variant
  if (appVariant === 'booking') {
    startWebServer()
  }

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

  // Proxy booking server requests through the main process to avoid
  // renderer-side CORS restrictions when calling external APIs.
  ipcMain.handle('booking-server-get', (_event, opts: MapsRequestOpts): Promise<unknown> => {
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
            reject(new Error('Failed to parse booking server response'))
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

  // Capture image from MJPEG stream
  ipcMain.handle('capture-mjpeg-frame', async (_event, { url, uuid }: { url: string; uuid: string }): Promise<{ success: boolean; path?: string; error?: string }> => {
    return new Promise((resolve) => {
      try {
        const request = net.request(url)
        let buffer = Buffer.alloc(0)
        let settled = false

        const finish = (result: { success: boolean; path?: string; error?: string }): void => {
          if (settled) return
          settled = true
          clearTimeout(timeout)
          try {
            request.abort()
          } catch {
            // no-op
          }
          resolve(result)
        }

        const timeout = setTimeout(() => {
          finish(writePlaceholderCapture(uuid, 'Timed out waiting for MJPEG frame'))
        }, CAPTURE_TIMEOUT_MS)

        request.on('response', (response) => {
          response.on('data', (chunk) => {
            if (settled) return
            buffer = Buffer.concat([buffer, chunk])

            // Find JPEG frame boundaries in MJPEG stream (FFD8 = start, FFD9 = end)
            const startIdx = buffer.indexOf(JPEG_START)
            const endIdx = startIdx !== -1 ? buffer.indexOf(JPEG_END, startIdx + 2) : -1

            if (startIdx !== -1 && endIdx !== -1) {
              try {
                const frameBuffer = buffer.slice(startIdx, endIdx + 2)
                const capturesDir = ensureCapturesDir()
                const filePath = join(capturesDir, `${uuid}.jpg`)
                writeFileSync(filePath, frameBuffer)
                finish({ success: true, path: filePath })
              } catch (err) {
                finish(writePlaceholderCapture(uuid, `Failed to save captured frame: ${err}`))
              }
              return
            }

            // Keep memory bounded while waiting for frame boundaries.
            if (buffer.length > 8 * 1024 * 1024) {
              buffer = buffer.slice(-2 * 1024 * 1024)
            }
          })

          response.on('end', () => {
            if (!settled) {
              finish(writePlaceholderCapture(uuid, 'No JPEG frame found in stream'))
            }
          })
        })

        request.on('error', (err) => {
          finish(writePlaceholderCapture(uuid, `Network error: ${err.message}`))
        })

        request.end()
      } catch (err) {
        resolve(writePlaceholderCapture(uuid, `Error: ${err}`))
      }
    })
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
