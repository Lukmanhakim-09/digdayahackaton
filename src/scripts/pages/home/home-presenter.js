import { isValidDetection } from '../../utils/index.js';

class HomePresenter {
  constructor(view, cameraService, detectionService, rootFactsService) {
    this.view = view;
    this.camera = cameraService;
    this.detector = detectionService;
    this.facts = rootFactsService;

    this.isRunning = false;
    this.currentLoopId = null;
  }

  async initialize() {
    this.view.disableAllInputs();
    this.view.updateHeaderStatus('Memuat model...', true);

    try {
      // Load both models in parallel
      await Promise.all([
        this.detector.loadModel(),
        this.facts.loadModel((progress) => {
          this.view.updateHeaderStatus(`Memuat model (${Math.round(progress)}%)`, true);
        }),
      ]);

      this.view.updateHeaderStatus('Siap', false);
      this.view.enableAllInputs();

      // Load camera list to select element
      await this.camera.loadCameras(this.view.cameraSelect);

      // Bind event listeners
      this.bindEvents();
    } catch (error) {
      console.error('Gagal menginisialisasi Presenter:', error);
      this.view.updateHeaderStatus('Error', false);
      this.view.showError('Gagal memuat model kecerdasan buatan.');
    }
  }

  bindEvents() {
    this.view.bindToggleCamera(() => this.toggleCamera());
    this.view.bindCameraChange(() => this.onCameraChange());
    this.view.bindFPSChange((fps) => this.onFPSChange(fps));
    this.view.bindToneChange((tone) => this.onToneChange(tone));
    this.view.bindCopy(() => this.copyToClipboard());
  }

  async toggleCamera() {
    if (this.camera.isActive()) {
      this.stopCamera();
    } else {
      await this.startCamera();
    }
  }

  async startCamera() {
    try {
      this.view.disableAllInputs();
      await this.camera.startCamera('media-video', 'media-canvas', this.view.cameraSelect);

      this.isRunning = true;
      this.view.updateCameraUI(true);
      this.view.enableAllInputs();

      this.view.switchToState('idle');

      // Start classification loop
      const loopId = Date.now();
      this.currentLoopId = loopId;
      this.detectLoop(loopId);
    } catch (error) {
      console.error('Gagal menjalankan kamera:', error);
      this.view.showError('Gagal membuka kamera.');
      this.view.enableAllInputs();
    }
  }

  stopCamera() {
    this.isRunning = false;
    this.currentLoopId = null;
    this.camera.stopCamera();
    this.view.updateCameraUI(false);
    this.view.switchToState('idle');
  }

  async onCameraChange() {
    if (this.camera.isActive()) {
      // Restart camera with new selection
      await this.startCamera();
    }
  }

  onFPSChange(fps) {
    this.camera.setFPS(fps);
  }

  onToneChange(tone) {
    this.facts.setTone(tone);
  }

  async detectLoop(loopId) {
    if (!this.isRunning || this.currentLoopId !== loopId) return;

    try {
      if (this.camera.isActive()) {
        const prediction = await this.detector.predict(this.camera.video);

        if (isValidDetection(prediction)) {
          // Pause prediction loop
          this.isRunning = false;

          // Show prediction metadata but load facts
          this.view.showResults(prediction, null);
          this.view.updateFunFactState('loading');

          // Generate facts using selected tone
          const tone = this.facts.currentTone;
          const fact = await this.facts.generateFacts(prediction.label, tone);

          // Update UI with final facts
          this.view.showResults(prediction, { funFact: fact });
        } else {
          // If not valid, wait based on FPS limiter configuration
          if (this.isRunning && this.currentLoopId === loopId) {
            const fps = this.camera.config?.fps || 30;
            const delay = Math.round(1000 / fps);
            setTimeout(() => this.detectLoop(loopId), delay);
          }
        }
      }
    } catch (error) {
      console.error('Kesalahan pada detection loop:', error);
      if (this.isRunning && this.currentLoopId === loopId) {
        setTimeout(() => this.detectLoop(loopId), 1000);
      }
    }
  }

  async copyToClipboard() {
    const text = this.view.getFunFactText();
    if (!text || text === 'Fakta menarik akan muncul di sini...' || text === 'Fakta tidak tersedia')
      return;

    try {
      await navigator.clipboard.writeText(text);
      this.view.setCopyButtonCopied();
      setTimeout(() => {
        this.view.resetCopyButton();
      }, 2000);
    } catch (error) {
      console.error('Gagal menyalin teks ke clipboard:', error);
    }
  }
}

export default HomePresenter;
