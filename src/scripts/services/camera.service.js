class CameraService {
  constructor() {
    this.stream = null;
    this.video = null;
    this.canvas = null;
    this.config = null;
  }

  // TODO [Basic] inisiasi elemen video dan canvas
  initializeElements(videoId, canvasId) {
    this.video = document.getElementById(videoId);
    this.canvas = document.getElementById(canvasId);
  }

  // TODO [Basic] Tambahkan konfigurasi kamera untuk mendapatkan daftar perangkat input video
  // TODO [Basic] Dapatkan constraints kamera berdasarkan konfigurasi dan kamera yang dipilih
  async loadCameras(cameraSelect) {
    try {
      // Prompt user for camera permissions first so labels are visible
      try {
        const tempStream = await navigator.mediaDevices.getUserMedia({
          video: true,
        });
        tempStream.getTracks().forEach((track) => track.stop());
      } catch (e) {
        console.warn('Izin kamera tidak dapat diperoleh terlebih dahulu:', e);
      }

      const devices = await navigator.mediaDevices.enumerateDevices();
      const videoDevices = devices.filter((device) => device.kind === 'videoinput');

      cameraSelect.innerHTML = '';

      if (videoDevices.length === 0) {
        const option = document.createElement('option');
        option.value = '';
        option.textContent = 'Kamera tidak ditemukan';
        cameraSelect.appendChild(option);
        return;
      }

      // Tambahkan pilihan Kamera Belakang dan Kamera Depan berbasis facingMode terlebih dahulu (sangat berguna untuk perangkat mobile)
      const backOption = document.createElement('option');
      backOption.value = 'default';
      backOption.textContent = 'Kamera Belakang (Utama)';
      cameraSelect.appendChild(backOption);

      const frontOption = document.createElement('option');
      frontOption.value = 'front';
      frontOption.textContent = 'Kamera Depan (Selfie)';
      cameraSelect.appendChild(frontOption);

      // Tambahkan daftar spesifik perangkat kamera yang terdeteksi di bawahnya
      videoDevices.forEach((device, index) => {
        const option = document.createElement('option');
        option.value = device.deviceId;
        option.textContent = device.label || `Kamera ${index + 1}`;
        cameraSelect.appendChild(option);
      });
    } catch (error) {
      console.error('Gagal memuat daftar kamera:', error);
    }
  }

  // TODO [Basic] Memulai kamera dengan perangkat yang dipilih dan menampilkan pada elemen video
  async startCamera(videoId, canvasId, cameraSelect) {
    this.initializeElements(videoId, canvasId);
    this.stopCamera();

    const deviceId = cameraSelect?.value;
    const fps = this.config?.fps || 30;

    const constraints = {
      video: {
        width: { ideal: 640 },
        height: { ideal: 480 },
        frameRate: { ideal: fps },
      },
      audio: false,
    };

    if (deviceId && deviceId !== 'default' && deviceId !== 'front') {
      constraints.video.deviceId = { exact: deviceId };
    } else if (deviceId === 'front') {
      constraints.video.facingMode = 'user';
    } else {
      constraints.video.facingMode = { ideal: 'environment' };
    }

    try {
      this.stream = await navigator.mediaDevices.getUserMedia(constraints);
      if (this.video) {
        this.video.srcObject = this.stream;
        await this.video.play();
      }
      return this.stream;
    } catch (error) {
      console.error('Gagal memulai kamera:', error);
      throw error;
    }
  }

  // TODO [Basic] Menghentikan siaran kamera dan membersihkan sumber daya
  stopCamera() {
    if (this.stream) {
      this.stream.getTracks().forEach((track) => track.stop());
      this.stream = null;
    }
    if (this.video) {
      this.video.srcObject = null;
    }
  }

  // TODO [Skilled] Implementasikan metode untuk mengatur FPS kamera
  setFPS(fps) {
    if (!this.config) {
      this.config = {};
    }
    this.config.fps = fps;

    if (this.stream) {
      const videoTrack = this.stream.getVideoTracks()[0];
      if (videoTrack && videoTrack.applyConstraints) {
        videoTrack
          .applyConstraints({ frameRate: { ideal: fps } })
          .catch((err) => console.error('Gagal mengubah FPS kamera:', err));
      }
    }
  }

  // TODO [Basic] Periksa apakah kamera sedang aktif
  isActive() {
    return !!(this.stream && this.stream.active);
  }
}

export default CameraService;
