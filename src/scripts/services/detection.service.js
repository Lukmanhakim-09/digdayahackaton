import * as tf from '@tensorflow/tfjs';
import '@tensorflow/tfjs-backend-webgpu';

class DetectionService {
  constructor() {
    this.model = null;
    this.labels = [];
    this.config = null;
    this.currentBackend = null;
    this.performanceStats = {
      operations: 0,
      totalTime: 0,
      averageTime: 0,
    };
  }

  // TODO [Basic] Muat model dan metadata secara bersamaan, lalu simpan ke instance
  // TODO [Advance] Implementasikan strategi Backend Adaptive
  async loadModel() {
    try {
      // Backend Adaptive strategy: WebGPU -> WebGL -> CPU
      const backends = ['webgpu', 'webgl', 'cpu'];
      let chosenBackend = 'cpu';
      for (const backend of backends) {
        try {
          await tf.setBackend(backend);
          await tf.ready();
          chosenBackend = backend;
          console.log(`TFJS Backend set to: ${backend}`);
          break;
        } catch (err) {
          console.warn(`Gagal memuat TFJS backend ${backend}, mencoba alternatif berikutnya...`);
        }
      }
      this.currentBackend = chosenBackend;

      // Load model and metadata concurrently
      const [model, metadata] = await Promise.all([
        tf.loadLayersModel('./model/model.json'),
        fetch('./model/metadata.json').then((res) => res.json()),
      ]);

      this.model = model;
      if (metadata && Array.isArray(metadata.labels)) {
        this.labels = metadata.labels;
      }
      console.log('Model TF.js dan metadata berhasil dimuat.');
    } catch (error) {
      console.error('Gagal menginisialisasi model deteksi:', error);
      throw error;
    }
  }

  // TODO [Basic] Lakukan prediksi pada elemen gambar yang diberikan dan kembalikan hasilnya
  async predict(imageElement) {
    if (!this.model) {
      throw new Error('Model belum dimuat.');
    }

    const startTime = performance.now();

    try {
      // Execute preprocessing in tf.tidy() to prevent memory leaks
      const processedTensor = tf.tidy(() => {
        const tensor = tf.browser.fromPixels(imageElement);

        // Center crop the input to a square (matching Teachable Machine's cropping behavior)
        const [height, width] = tensor.shape;
        const size = Math.min(height, width);
        const yStart = Math.floor((height - size) / 2);
        const xStart = Math.floor((width - size) / 2);
        const cropped = tensor.slice([yStart, xStart, 0], [size, size, 3]);

        // Resize to 224x224 pixels
        const resized = tf.image.resizeBilinear(cropped, [224, 224]);

        // Normalize pixel values from [0, 255] to [-1, 1] range
        const normalized = resized.toFloat().div(127.5).sub(1.0);

        // Add batch dimension [1, 224, 224, 3]
        return normalized.expandDims(0);
      });

      // Run prediction
      const prediction = this.model.predict(processedTensor);
      const predictionData = await prediction.data();

      // Clean up tensors
      processedTensor.dispose();
      prediction.dispose();

      // Identify the class with the highest probability
      let maxIdx = 0;
      let maxVal = -1;
      for (let i = 0; i < predictionData.length; i++) {
        if (predictionData[i] > maxVal) {
          maxVal = predictionData[i];
          maxIdx = i;
        }
      }

      const label = this.labels[maxIdx] || 'Tidak Dikenal';
      const confidence = Math.round(maxVal * 100);

      // Track performance metrics
      const endTime = performance.now();
      const elapsed = endTime - startTime;
      this.performanceStats.operations += 1;
      this.performanceStats.totalTime += elapsed;
      this.performanceStats.averageTime =
        this.performanceStats.totalTime / this.performanceStats.operations;

      const threshold = this.config?.detectionConfidenceThreshold || 70;
      return {
        label: label,
        confidence: confidence,
        isValid: confidence >= threshold,
      };
    } catch (error) {
      console.error('Kesalahan prediksi model:', error);
      throw error;
    }
  }

  isLoaded() {
    return !!this.model;
  }
}

export default DetectionService;
