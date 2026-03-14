import { app, BrowserWindow, Tray, nativeImage, Menu, ipcMain } from 'electron'
import { fileURLToPath } from 'node:url'
import path from 'node:path'

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

function createWindow() {
  win = new BrowserWindow({
    width: 1280,
    height: 800,
    minWidth: 900,
    minHeight: 600,
    icon: path.join(process.env.VITE_PUBLIC, 'app.png'),
    webPreferences: {
      preload: path.join(__dirname, 'preload.mjs'),
    },
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

function createTrayIcon() {
  if (tray) {
    return
  }
  const iconPath = path.join(process.env.VITE_PUBLIC!, 'corgi_icon.png')
  const image = nativeImage.createFromPath(iconPath)
  console.log("Creating Menu Item")
  // macOS menu bar: 22x22; Windows system tray: 16x16
  const size = process.platform === 'darwin' ? 22 : 16
  const trayImage = image.resize({ width: size, height: size })
  tray = new Tray(trayImage)
  tray.setToolTip('Corgi App')
  const contextMenu = Menu.buildFromTemplate([
    {
      label: 'Show App',
      click: () => showOrCreateWindow(),
    },
    { type: 'separator' },
    {
      label: 'Quit',
      click: () => app.quit(),
    },
  ])
  tray.setContextMenu(contextMenu)
  // Consume click so icon never opens the window (same on macOS and Windows)
  tray.on('click', () => { })
}

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

app.whenReady().then(() => {
  createWindow()
  createTrayIcon()
  ipcMain.handle('create-tray', () => {
    createTrayIcon()
  })
})
