const iframe = document.getElementById('app');
const spinner = document.getElementById('spinner');
const fallback = document.getElementById('fallback');
const openFullBtn = document.getElementById('openFull');

let startedLoadingApp = false;

function showIframe() {
  if (spinner) spinner.style.display = 'none';
  if (fallback) fallback.style.display = 'none';
  if (iframe) iframe.style.display = 'block';
}

function showFallback() {
  if (spinner) spinner.style.display = 'none';
  if (iframe) iframe.style.display = 'none';
  if (fallback) fallback.style.display = 'block';
}

if (iframe) {
  iframe.addEventListener('load', () => {
    if (!startedLoadingApp) return;
    showIframe();
  });
}

if (openFullBtn) {
  openFullBtn.addEventListener('click', () => {
    // 在新标签页打开完整站点
    window.open('https://site.mornscience.top/', '_blank');
  });
}

setTimeout(() => {
  if (!iframe) return;
  if (iframe.style.display === 'none') {
    showFallback();
  }
}, 5000);

if (iframe) {
  const target = iframe.getAttribute('data-src');
  if (target) {
    requestAnimationFrame(() => {
      startedLoadingApp = true;
      iframe.src = target;
    });
  }
}
