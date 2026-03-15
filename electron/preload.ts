import { ipcRenderer, contextBridge } from 'electron'

// --------- Expose some API to the Renderer process ---------
contextBridge.exposeInMainWorld('ipcRenderer', {
  on(...args: Parameters<typeof ipcRenderer.on>) {
    const [channel, listener] = args
    return ipcRenderer.on(channel, (event, ...args) => listener(event, ...args))
  },
  off(...args: Parameters<typeof ipcRenderer.off>) {
    const [channel, ...omit] = args
    return ipcRenderer.off(channel, ...omit)
  },
  send(...args: Parameters<typeof ipcRenderer.send>) {
    const [channel, ...omit] = args
    return ipcRenderer.send(channel, ...omit)
  },
  invoke(...args: Parameters<typeof ipcRenderer.invoke>) {
    const [channel, ...omit] = args
    return ipcRenderer.invoke(channel, ...omit)
  },
})

// --------- Activity tracking API ---------
contextBridge.exposeInMainWorld('activityBridge', {
  startTracking() {
    ipcRenderer.send('activity-start')
  },
  stopTracking() {
    ipcRenderer.send('activity-stop')
  },
  onUpdate(callback: (data: { app: string; idleSeconds: number; timestamp: number }) => void) {
    const handler = (_event: Electron.IpcRendererEvent, data: { app: string; idleSeconds: number; timestamp: number }) => {
      callback(data)
    }
    ipcRenderer.on('activity-update', handler)
    return () => {
      ipcRenderer.off('activity-update', handler)
    }
  },
  onTabUpdate(callback: (data: { url: string; title: string; timestamp: number }) => void) {
    const handler = (_event: Electron.IpcRendererEvent, data: { url: string; title: string; timestamp: number }) => {
      callback(data)
    }
    ipcRenderer.on('tab-update', handler)
    return () => {
      ipcRenderer.off('tab-update', handler)
    }
  },
})
