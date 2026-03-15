/**
 * Send a native OS notification via Electron's main process.
 *
 * HOW TO EXTEND FOR LLM-GENERATED CONTENT LATER:
 *   Pass dynamic title/body strings from your LLM response directly into
 *   this function — the IPC contract does not need to change.
 */
export function sendOSNotification(title: string, body: string, icon?: string): void {
  try {
    // window.ipcRenderer is exposed by electron/preload.ts via contextBridge
    window.ipcRenderer?.send('show-os-notification', { title, body, icon });
  } catch {
    // Silently no-op outside Electron (e.g. browser dev preview)
  }
}
