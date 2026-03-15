const SERVER_URL = 'http://localhost:9147/tab-event';

function sendTabEvent(url, title) {
  if (!url || url.startsWith('chrome://') || url.startsWith('chrome-extension://')) return;

  fetch(SERVER_URL, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ url, title: title || '', timestamp: Date.now() }),
  }).catch(() => {
    // Server not running (session not active) — silently ignore
  });
}

// Fires when the user switches to a different tab
chrome.tabs.onActivated.addListener(async (info) => {
  try {
    const tab = await chrome.tabs.get(info.tabId);
    sendTabEvent(tab.url, tab.title);
  } catch {
    // Tab may have been closed
  }
});

// Fires when a tab finishes loading a new page (navigation within same tab)
chrome.tabs.onUpdated.addListener((tabId, changeInfo, tab) => {
  if (changeInfo.status === 'complete' && tab.active && tab.url) {
    sendTabEvent(tab.url, tab.title);
  }
});
