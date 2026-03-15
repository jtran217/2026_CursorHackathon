import { app, BrowserWindow, Tray, nativeImage, Menu, ipcMain, powerMonitor, Notification } from 'electron'
import { execFileSync, execSync, spawn, ChildProcess } from 'node:child_process'
import { fileURLToPath } from 'node:url'
import path from 'node:path'
import fs from 'node:fs'
import http from 'node:http'

const __dirname = path.dirname(fileURLToPath(import.meta.url))

// The built directory structure
//
// ├─┬─┬ dist
// │ │ └── index.html
// │ │
// │ ├─┬ dist-electron
// │ │ ├── main.js
// │ │ └── preload.mjs
// │
process.env.APP_ROOT = path.join(__dirname, '..')

// 🚧 Use ['ENV_NAME'] avoid vite:define plugin - Vite@2.x
export const VITE_DEV_SERVER_URL = process.env['VITE_DEV_SERVER_URL']
export const MAIN_DIST = path.join(process.env.APP_ROOT, 'dist-electron')
export const RENDERER_DIST = path.join(process.env.APP_ROOT, 'dist')

process.env.VITE_PUBLIC = VITE_DEV_SERVER_URL ? path.join(process.env.APP_ROOT, 'public') : RENDERER_DIST

let win: BrowserWindow | null
let tray: Tray | null = null
let focusSessionActive = false
let sessionElapsedMs = 0
let backendProcess: ChildProcess | null = null

function resolveDevPython(appRoot: string): string {
  const isWin = process.platform === 'win32'
  const binDir = isWin ? 'Scripts' : 'bin'
  const pyExe = isWin ? 'python.exe' : 'python'
  const candidates = [
    path.join(appRoot, '.venv', binDir, pyExe),
    path.join(appRoot, 'backend', '.venv', binDir, pyExe),
  ]
  const venvPython = candidates.find((p) => fs.existsSync(p))
  if (venvPython) return venvPython
  for (const cmd of ['python3', 'python']) {
    try {
      execFileSync(cmd, ['--version'], { stdio: 'ignore' })
      return cmd
    } catch {
      // not found
    }
  }
  return 'python3'
}

function startBackend() {
  const dbPath = path.join(app.getPath('userData'), 'app.db')
  const env = { ...process.env, DATABASE_URL: `sqlite:///${dbPath}`, BACKEND_PORT: '5001' }

  if (VITE_DEV_SERVER_URL) {
    // In dev mode, spawn Flask directly using the local Python interpreter
    const python = resolveDevPython(process.env.APP_ROOT as string)
    backendProcess = spawn(python, ['app.py'], {
      cwd: path.join(process.env.APP_ROOT as string, 'backend'),
      env,
    })
  } else {
    // In production, use the PyInstaller-bundled binary from extraResources
    const backendBinary = path.join(process.resourcesPath, 'backend', 'restore-backend')
    backendProcess = spawn(backendBinary, [], { env })
  }

  backendProcess.on('error', (err) => {
    console.error('[backend] Failed to start:', err)
  })
}

function stopBackend() {
  if (backendProcess) {
    backendProcess.kill()
    backendProcess = null
  }
}

function formatSessionTime(ms: number): string {
  const totalSeconds = Math.floor(ms / 1000)
  const minutes = Math.floor(totalSeconds / 60)
  const seconds = totalSeconds % 60
  return `${String(minutes).padStart(2, '0')}:${String(seconds).padStart(2, '0')}`
}

function updateTrayTooltip() {
  if (!tray) return
  if (focusSessionActive) {
    tray.setToolTip(`Remaining: ${formatSessionTime(sessionElapsedMs)}`)
  } else {
    tray.setToolTip('Restore')
  }
}

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'main_icon.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
  })

  win.on('close', (event) => {
    if (tray && !(app as any).isQuitting) {
      event.preventDefault()
      win?.hide()
    }
  })

  win.on('closed', () => {
    win = null
  })

  // Test active push message to Renderer-process.
  win.webContents.on('did-finish-load', () => {
    win?.webContents.send('main-process-message', (new Date).toLocaleString())
  })

  if (VITE_DEV_SERVER_URL) {
    win.loadURL(VITE_DEV_SERVER_URL)
  } else {
    // win.loadFile('dist/index.html')
    win.loadFile(path.join(RENDERER_DIST, 'index.html'))
  }
}

function showOrCreateWindow() {
  if (win && !win.isDestroyed()) {
    win.show()
    win.focus()
  } else {
    createWindow()
  }
}

function updateTrayContextMenu() {
  if (!tray) return
  const focusItem = focusSessionActive
    ? {
      label: 'End Focus Session',
      click: () => {
        showOrCreateWindow()
        if (win && !win.isDestroyed()) {
          const sendEndFocus = () => win!.webContents.send('tray-end-focus-session')
          if (win.webContents.isLoading()) {
            win.webContents.once('did-finish-load', sendEndFocus)
          } else {
            sendEndFocus()
          }
        }
      },
    }
    : {
      label: 'Start Focus Session',
      click: () => {
        showOrCreateWindow()
        if (win && !win.isDestroyed()) {
          const sendStartFocus = () => win!.webContents.send('tray-start-focus-session')
          if (win.webContents.isLoading()) {
            win.webContents.once('did-finish-load', sendStartFocus)
          } else {
            sendStartFocus()
          }
        }
      },
    }
  const menuItems: Electron.MenuItemConstructorOptions[] = [
    {
      label: 'Show Restore',
      click: () => showOrCreateWindow(),
    },
    focusItem,
  ]
  if (focusSessionActive) {
    menuItems.push({
      label: `Time left: ${formatSessionTime(sessionElapsedMs)}`,
      enabled: false,
    })
    menuItems.push({
      label: "I'm overwhelmed",
      click: () => {
        showOrCreateWindow()
        if (win && !win.isDestroyed()) {
          const sendImOverwhelmed = () => win!.webContents.send('tray-im-overwhelmed')
          if (win.webContents.isLoading()) {
            win.webContents.once('did-finish-load', sendImOverwhelmed)
          } else {
            sendImOverwhelmed()
          }
        }
      },
    })
  }
  menuItems.push(
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    }
  )
  tray.setContextMenu(Menu.buildFromTemplate(menuItems))
  updateTrayTooltip()
}

function createTrayIcon() {
  if (tray) {
    return
  }
  const iconPath = path.join(process.env.VITE_PUBLIC!, 'corgi_icon.png')
  const image = nativeImage.createFromPath(iconPath)
  // macOS menu bar: 22x22; Windows system tray: 16x16
  const size = process.platform === 'darwin' ? 22 : 16
  const trayImage = image.resize({ width: size, height: size })
  tray = new Tray(trayImage)
  updateTrayContextMenu()
  // Consume click so icon never opens the window (same on macOS and Windows)
  tray.on('click', () => { })
}

app.on('before-quit', () => {
  (app as any).isQuitting = true
})

// Keep app running when window closes if tray exists; otherwise quit on Windows/Linux.
app.on('window-all-closed', () => {
  if (tray) {
    return
  }
  if (process.platform !== 'darwin') {
    app.quit()
  }
})

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow()
  } else {
    showOrCreateWindow()
  }
})

// Single instance: second launch focuses existing app
const gotTheLock = app.requestSingleInstanceLock()
if (!gotTheLock) {
  app.quit()
} else {
  app.on('second-instance', () => {
    showOrCreateWindow()
  })
}

// ---------------------------------------------------------------------------
// Activity Monitor — polls frontmost app + idle time every 5s
// ---------------------------------------------------------------------------
class ActivityMonitor {
  private interval: ReturnType<typeof setInterval> | null = null

  start() {
    if (this.interval) return

    this.interval = setInterval(() => {
      if (!win || win.isDestroyed()) return

      let frontApp = 'Unknown'
      try {
        frontApp = execSync(
          `osascript -e 'tell application "System Events" to get name of first application process whose frontmost is true'`,
          { encoding: 'utf-8', timeout: 3000 }
        ).trim()
      } catch {
        // osascript can fail if accessibility permissions are missing
      }

      const idleSeconds = powerMonitor.getSystemIdleTime()

      win.webContents.send('activity-update', {
        app: frontApp,
        idleSeconds,
        timestamp: Date.now(),
      })
    }, 5000)
  }

  stop() {
    if (this.interval) {
      clearInterval(this.interval)
      this.interval = null
    }
  }
}

const activityMonitor = new ActivityMonitor()

// ---------------------------------------------------------------------------
// Tab Server — local HTTP server on port 9147 to receive Chrome extension events
// ---------------------------------------------------------------------------
const TAB_SERVER_PORT = 9147
const BACKEND_URL = 'http://127.0.0.1:5000'
const CLASSIFY_CACHE_TTL_MS = 24 * 60 * 60 * 1000 // 24h

interface ClassifyCacheEntry {
  isDistracting: boolean
  timestamp: number
}

class TabServer {
  private server: http.Server | null = null
  private classifyCache = new Map<string, ClassifyCacheEntry>()

  private async classifySite(url: string, title: string): Promise<{ domain: string; isDistracting: boolean } | null> {
    try {
      const parsed = new URL(url.startsWith('http') ? url : `https://${url}`)
      let domain = parsed.hostname || 'unknown'
      if (domain.startsWith('www.')) domain = domain.slice(4)
      const cached = this.classifyCache.get(domain)
      if (cached && Date.now() - cached.timestamp < CLASSIFY_CACHE_TTL_MS) {
        return { domain, isDistracting: cached.isDistracting }
      }
      const res = await fetch(`${BACKEND_URL}/api/classify-site`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ url, title }),
      })
      if (!res.ok) return null
      const data = (await res.json()) as { domain: string; is_distracting: boolean }
      this.classifyCache.set(data.domain, {
        isDistracting: data.is_distracting,
        timestamp: Date.now(),
      })
      return { domain: data.domain, isDistracting: data.is_distracting }
    } catch {
      return null
    }
  }

  start() {
    if (this.server) return

    this.server = http.createServer((req, res) => {
      // Handle CORS preflight
      res.setHeader('Access-Control-Allow-Origin', '*')
      res.setHeader('Access-Control-Allow-Methods', 'POST, OPTIONS')
      res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

      if (req.method === 'OPTIONS') {
        res.writeHead(204)
        res.end()
        return
      }

      if (req.method === 'POST' && req.url === '/tab-event') {
        let body = ''
        req.on('data', (chunk) => { body += chunk.toString() })
        req.on('end', () => {
          try {
            const data = JSON.parse(body) as { url: string; title: string; timestamp: number }
            if (win && !win.isDestroyed()) {
              win.webContents.send('tab-update', data)
            }
            res.writeHead(200)
            res.end('ok')
            // Classify in background; don't block response
            this.classifySite(data.url, data.title ?? '').then((result) => {
              if (result && win && !win.isDestroyed()) {
                win.webContents.send('site-classification', {
                  domain: result.domain,
                  isDistracting: result.isDistracting,
                })
              }
            }).catch(() => {})
          } catch {
            res.writeHead(400)
            res.end('bad request')
          }
        })
      } else {
        res.writeHead(404)
        res.end()
      }
    })

    this.server.listen(TAB_SERVER_PORT, '127.0.0.1')

    this.server.on('error', () => {
      // Port may already be in use — silently ignore
    })
  }

  stop() {
    if (this.server) {
      this.server.close()
      this.server = null
    }
    this.classifyCache.clear()
  }
}

const tabServer = new TabServer()

app.on('before-quit', () => {
  stopBackend()
})

app.whenReady().then(() => {
  startBackend()
  createWindow()
  createTrayIcon()

  // Creating the tray features
  ipcMain.handle('create-tray', () => {
    createTrayIcon()
  })

  ipcMain.on('tray-set-focus-session-active', (_event, active: boolean) => {
    focusSessionActive = active
    if (tray) {
      updateTrayContextMenu()
      updateTrayTooltip()
    }
  })
  ipcMain.on('tray-set-session-elapsed-ms', (_event, ms: number) => {
    sessionElapsedMs = ms
    if (tray && focusSessionActive) {
      updateTrayContextMenu()
      updateTrayTooltip()
    }
  })

  // Activity Tracking
  ipcMain.on('activity-start', () => {
    activityMonitor.start()
    tabServer.start()
  })

  ipcMain.on('activity-stop', () => {
    activityMonitor.stop()
    tabServer.stop()
  })

  // Desktop notification (focus nudge); icon = astro_side.png
  ipcMain.handle('show-notification', (_event, { title, body }: { title: string; body: string }) => {
    const iconPath = path.join(process.env.VITE_PUBLIC ?? '', 'astro_side.png')
    const notification = new Notification({
      title: title ?? 'Focus',
      body: body ?? '',
      icon: iconPath,
    })
    notification.show()
  })
})
