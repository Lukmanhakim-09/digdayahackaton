import '../styles/styles.css';
import App from './pages/app.js';

// Register service worker FIRST — sebelum kode async apapun
// agar listener 'load' pasti terdaftar sebelum event-nya muncul
if ('serviceWorker' in navigator) {
  const registerSW = () => {
    navigator.serviceWorker
      .register('./sw.js')
      .then((reg) => {
        console.log('Service Worker registered successfully with scope:', reg.scope);
      })
      .catch((err) => {
        console.error('Service Worker registration failed:', err);
      });
  };

  // Jika dokumen sudah selesai loading, langsung daftar
  // Jika belum, tunggu event 'load'
  if (document.readyState === 'complete') {
    registerSW();
  } else {
    window.addEventListener('load', registerSW);
  }
}

document.addEventListener('DOMContentLoaded', async () => {
  const app = new App({
    container: document.querySelector('#main-content'),
  });

  await app.renderPage();

  if (typeof lucide !== 'undefined') {
    lucide.createIcons();
  }
});
