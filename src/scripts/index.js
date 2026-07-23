import '../styles/styles.css';
import App from './pages/app.js';

if ('serviceWorker' in navigator) {
  window.addEventListener('load', async () => {
    try {
      const registration = await navigator.serviceWorker.register('./sw.js');
      console.log('Service Worker registered successfully with scope:', registration.scope);
    } catch (err) {
      console.error('Service Worker registration failed:', err);
    }
  });
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
