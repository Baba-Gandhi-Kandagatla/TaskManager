// Always offer installation guidance, even without a native install prompt.
(() => {
  let pending;
  const button = document.querySelector('#installBtn');
  const standalone = window.matchMedia('(display-mode: standalone)');
  function update() {
    button.classList.toggle('hidden', standalone.matches || navigator.standalone === true);
  }
  window.addEventListener('beforeinstallprompt', event => {
    event.preventDefault(); pending = event; update();
  });
  window.addEventListener('appinstalled', () => { pending = null; button.classList.add('hidden'); });
  standalone.addEventListener('change', update);
  button.onclick = async () => {
    if (pending) {
      const prompt = pending; pending = null;
      try { await prompt.prompt(); await prompt.userChoice; update(); return; }
      catch { /* Offer browser instructions if the prompt is no longer available. */ }
    }
    const dialog = document.createElement('dialog');
    dialog.innerHTML = '<div class="install-guide"><div class="dialog-head"><h2>Install Orbit</h2><button class="icon-btn" aria-label="Close">×</button></div><p>On Android, open this site directly in Chrome, then tap <strong>⋮ → Add to Home screen → Install</strong>.</p><p>If you opened it inside WhatsApp or another app, first choose <strong>Open in Chrome</strong>.</p><p>On iPhone, use <strong>Share → Add to Home Screen</strong>. On a laptop, use your browser’s install option in its menu or address bar.</p><p class="subtle">If Orbit is already installed, open it from your home screen.</p></div>';
    document.body.append(dialog);
    dialog.querySelector('button').onclick = () => dialog.close();
    dialog.addEventListener('close', () => dialog.remove());
    dialog.showModal();
  };
  update();
})();
