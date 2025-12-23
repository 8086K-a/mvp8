const IFRAME_ID = 'app';
const API_ENDPOINT = 'https://site.mornscience.top/api/bookmarks';

function postToIframe(message) {
  const iframe = document.getElementById(IFRAME_ID);
  if (!iframe || !iframe.contentWindow) return;
  iframe.contentWindow.postMessage(message, '*');
}

async function saveCurrentTab() {
  const tabs = await chrome.tabs.query({ active: true, currentWindow: true });
  const tab = tabs && tabs[0];

  if (!tab || !tab.url) {
    throw new Error('无法获取当前标签页信息');
  }

  const payload = {
    url: tab.url,
    title: tab.title || '',
    favicon: tab.favIconUrl || ''
  };

  const resp = await fetch(API_ENDPOINT, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    credentials: 'include',
    body: JSON.stringify(payload)
  });

  if (!resp.ok) {
    let detail = '';
    try {
      detail = await resp.text();
    } catch (_) {
      detail = '';
    }
    throw new Error(detail ? `${resp.status} ${detail}` : String(resp.status));
  }
}

window.addEventListener('message', async (event) => {
  const data = event && event.data;
  if (!data || data.type !== 'SAVE_CURRENT_TAB') return;

  try {
    await saveCurrentTab();
    postToIframe({ type: 'SAVE_SUCCESS' });
  } catch (e) {
    postToIframe({
      type: 'SAVE_ERROR',
      message: e && e.message ? e.message : 'error'
    });
  }
});
