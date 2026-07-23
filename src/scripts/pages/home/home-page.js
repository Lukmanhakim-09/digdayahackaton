import { generateCameraSection, generateInfoPanel, generateFooter } from '../../templates.js';
import CameraService from '../../services/camera.service.js';
import DetectionService from '../../services/detection.service.js';
import RootFactsService from '../../services/rootfacts.service.js';
import HomePresenter from './home-presenter.js';
import {
  hideElement,
  showElement,
  setElementText,
  addFadeInAnimation,
  getConfidenceTheme,
} from '../../utils/index.js';

export default class HomePage {
  #presenter = null;

  async render() {
    return `
      <main class="main-content">
        ${generateCameraSection()}
        ${generateInfoPanel()}
      </main>
      ${generateFooter()}
    `;
  }

  async afterRender() {
    // Select header elements
    this.headerStatus = document.getElementById('header-status');
    this.headerStatusSpan = document.getElementById('status-text');
    this.headerStatusDot = document.getElementById('status-dot');

    // Select settings elements
    this.btnToggle = document.getElementById('btn-toggle');
    this.btnToggleIcon = this.btnToggle?.querySelector('i');
    this.cameraSelect = document.getElementById('camera-select');
    this.fpsSlider = document.getElementById('fps-slider');
    this.fpsLabel = document.getElementById('fps-label');
    this.toneSelect = document.getElementById('tone-select');

    // Select state panels
    this.stateIdle = document.getElementById('state-idle');
    this.stateLoading = document.getElementById('state-loading');
    this.stateResult = document.getElementById('state-result');

    // Select result elements
    this.detectedName = document.getElementById('detected-name');
    this.detectedConfidence = document.getElementById('detected-confidence');
    this.confidenceFill = document.getElementById('confidence-fill');

    // Select fun fact elements
    this.funFactLoading = document.getElementById('fun-fact-loading');
    this.funFactContent = document.getElementById('fun-fact-content');
    this.funFactText = document.getElementById('fun-fact-text');
    this.btnCopy = document.getElementById('btn-copy');

    // Filter input elements
    this.inputElements = [
      this.btnToggle,
      this.cameraSelect,
      this.fpsSlider,
      this.toneSelect,
    ].filter(Boolean);

    // Initialize Services and Presenter (MVP Wiring)
    const cameraService = new CameraService();
    const detectionService = new DetectionService();
    const rootFactsService = new RootFactsService();

    this.#presenter = new HomePresenter(this, cameraService, detectionService, rootFactsService);
    await this.#presenter.initialize();
  }

  // View methods called by Presenter
  disableAllInputs() {
    this.inputElements.forEach((el) => {
      el.disabled = true;
      el.style.opacity = '0.6';
      el.style.cursor = 'not-allowed';
    });
  }

  enableAllInputs() {
    this.inputElements.forEach((el) => {
      el.disabled = false;
      el.style.opacity = '1';
      el.style.cursor = 'pointer';
    });
  }

  updateHeaderStatus(text, isActive) {
    if (this.headerStatusSpan) {
      setElementText(this.headerStatusSpan, text);
    }
    if (this.headerStatusDot) {
      if (isActive) {
        this.headerStatusDot.classList.add('active');
      } else {
        this.headerStatusDot.classList.remove('active');
      }

      // Dynamic color styling for status dot based on state
      if (text === 'Error') {
        this.headerStatusDot.style.backgroundColor = '#ef4444'; // Red
      } else if (text === 'Siap') {
        this.headerStatusDot.style.backgroundColor = '#10b981'; // Green
      } else if (text === 'Memuat model...') {
        this.headerStatusDot.style.backgroundColor = '#f59e0b'; // Amber
      } else {
        this.headerStatusDot.style.backgroundColor = ''; // Reset default
      }
    }
  }

  updateCameraUI(isActive) {
    if (isActive) {
      this.btnToggle?.classList.add('scanning');
      if (this.btnToggleIcon) {
        this.btnToggleIcon.setAttribute('data-lucide', 'square');
      }
      const overlay = document.getElementById('camera-overlay');
      if (overlay) overlay.classList.add('active');
      const placeholder = document.getElementById('camera-placeholder');
      hideElement(placeholder);
      this.updateHeaderStatus('Scanning...', true);
    } else {
      this.btnToggle?.classList.remove('scanning');
      if (this.btnToggleIcon) {
        this.btnToggleIcon.setAttribute('data-lucide', 'scan-line');
      }
      const overlay = document.getElementById('camera-overlay');
      if (overlay) overlay.classList.remove('active');
      const placeholder = document.getElementById('camera-placeholder');
      showElement(placeholder);
      this.updateHeaderStatus('Siap', false);
    }

    if (typeof lucide !== 'undefined') {
      lucide.createIcons();
    }
  }

  switchToState(newState) {
    hideElement(this.stateIdle);
    hideElement(this.stateLoading);
    hideElement(this.stateResult);

    switch (newState) {
    case 'idle':
      showElement(this.stateIdle);
      break;
    case 'loading':
      showElement(this.stateLoading);
      break;
    case 'result':
      showElement(this.stateResult);
      break;
    }
  }

  showResults(prediction, funFactData) {
    this.switchToState('result');

    if (this.detectedName) {
      setElementText(this.detectedName, prediction.label);
    }

    // Determine confidence theme color (green/yellow/red)
    const theme = getConfidenceTheme(prediction.confidence);
    let color = '#10b981'; // Green (Excellent)
    if (theme === 'yellow') {
      color = '#f59e0b'; // Yellow (Good)
    } else if (theme === 'red') {
      color = '#ef4444'; // Red (Low)
    }

    if (this.detectedConfidence) {
      setElementText(this.detectedConfidence, `${prediction.confidence}%`);
      this.detectedConfidence.style.color = color;
    }

    if (this.confidenceFill) {
      this.confidenceFill.style.width = `${prediction.confidence}%`;
      this.confidenceFill.style.backgroundColor = color;
    }

    if (!funFactData) {
      this.updateFunFactState('loading');
    } else {
      this.updateFunFactState('success', funFactData);
    }

    addFadeInAnimation(this.stateResult);
  }

  updateFunFactState(state, funFactData = null) {
    switch (state) {
    case 'loading':
      this.disableAllInputs();
      hideElement(this.funFactContent);
      showElement(this.funFactLoading);
      break;

    case 'success':
      this.enableAllInputs();
      hideElement(this.funFactLoading);
      showElement(this.funFactContent);
      if (funFactData && funFactData.funFact && this.funFactText) {
        setElementText(this.funFactText, funFactData.funFact);
      }
      break;

    case 'error':
      this.enableAllInputs();
      hideElement(this.funFactLoading);
      showElement(this.funFactContent);
      if (this.funFactText) {
        setElementText(this.funFactText, 'Fakta tidak tersedia');
      }
      break;
    }
  }

  getFunFactText() {
    return this.funFactText?.textContent || '';
  }

  setCopyButtonCopied() {
    if (this.btnCopy) {
      this.btnCopy.classList.add('copied');
      this.btnCopy.innerHTML = '<i data-lucide="check" width="18" height="18"></i>';
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  resetCopyButton() {
    if (this.btnCopy) {
      this.btnCopy.classList.remove('copied');
      this.btnCopy.innerHTML = '<i data-lucide="copy" width="18" height="18"></i>';
      if (typeof lucide !== 'undefined') {
        lucide.createIcons();
      }
    }
  }

  showError(message) {
    this.updateHeaderStatus('Error', false);
    alert(message);
    setTimeout(() => {
      this.updateCameraUI(false);
      this.switchToState('idle');
      this.updateHeaderStatus('Siap', false);
    }, 3000);
  }

  // Event bindings from Presenter
  bindToggleCamera(handler) {
    this.btnToggle?.addEventListener('click', (e) => {
      if (this.btnToggle.disabled) {
        e.preventDefault();
        return;
      }
      handler();
    });
  }

  bindCameraChange(handler) {
    this.cameraSelect?.addEventListener('change', () => {
      handler();
    });
  }

  bindFPSChange(handler) {
    this.fpsSlider?.addEventListener('input', (e) => {
      const fps = parseInt(e.target.value, 10);
      if (this.fpsLabel) {
        setElementText(this.fpsLabel, `${fps} FPS`);
      }
      handler(fps);
    });
  }

  bindToneChange(handler) {
    this.toneSelect?.addEventListener('change', (e) => {
      handler(e.target.value);
    });
  }

  bindCopy(handler) {
    this.btnCopy?.addEventListener('click', () => {
      handler();
    });
  }
}
