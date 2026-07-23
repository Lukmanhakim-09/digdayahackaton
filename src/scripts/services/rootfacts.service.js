import { pipeline, env } from '@huggingface/transformers';

// Menonaktifkan pencarian model lokal agar tidak mengalami error parsing JSON
// akibat pengalihan halaman 404 (historyApiFallback) oleh dev server Webpack.
env.allowLocalModels = false;

const MODEL_NAME = 'Xenova/LaMini-Flan-T5-77M'; // Anda dapat mengubah ke 'Xenova/LaMini-Flan-T5-783M' jika membutuhkan model yang lebih besar.

const FALLBACK_FACTS = {
  beetroot: {
    normal: 'Bit kaya akan senyawa nitrat alami yang dapat membantu menurunkan tekanan darah dan meningkatkan stamina.',
    funny: 'Bit bisa membuat urin Anda berwarna merah muda! Jangan panik, Anda tidak sedang berubah menjadi vampir.',
    professional: 'Secara ilmiah, Beta vulgaris (bit) mengandung betalain yang berfungsi sebagai antioksidan kuat untuk detoksifikasi hati.',
    casual: 'Tahu gak? Makan bit bisa bikin stamina naik pas olahraga karena kandungan nitratnya yang melimpah!'
  },
  paprika: {
    normal: 'Paprika merah mengandung vitamin C hampir tiga kali lipat lebih banyak dibandingkan dengan jeruk manis.',
    funny: 'Paprika itu sebenarnya buah lho, tapi mereka menyamar jadi sayur biar bisa masuk ke dalam sup hangat.',
    professional: 'Capsicum annuum (paprika) merupakan sumber askorbat (vitamin C) dan karotenoid yang esensial bagi kekebalan tubuh.',
    casual: 'Paprika merah juara banget nih soal vitamin C, kandungannya bahkan ngalahin buah jeruk!'
  },
  cabbage: {
    normal: 'Kubis telah dibudidayakan selama ribuan tahun dan merupakan salah satu sayuran tertua dalam sejarah manusia.',
    funny: 'Kubis sangat rendah kalori, saking rendahnya Anda mungkin membakar lebih banyak kalori saat mengunyahnya.',
    professional: 'Brassica oleracea (kubis) kaya akan glukosinolat yang memiliki sifat antikanker berdasarkan berbagai studi klinis.',
    casual: 'Kubis itu sayuran legendaris yang udah ditanam manusia dari zaman kuno. Seratnya tinggi banget!'
  },
  carrot: {
    normal: 'Wortel awalnya berwarna ungu atau kuning, sebelum varietas wortel oranye dikembangkan di Belanda pada abad ke-17.',
    funny: 'Kelinci sangat suka wortel, tapi mereka tidak pernah memakai kacamata karena wortel memang bagus untuk mata mereka.',
    professional: 'Daucus carota (wortel) mengandung konsentrasi beta-karoten tinggi yang dikonversi menjadi vitamin A oleh tubuh manusia.',
    casual: 'Wortel zaman dulu itu warnanya ungu, bukan oranye. Tapi khasiatnya buat mata tetep juara!'
  },
  cauliflower: {
    normal: 'Kembang kol dapat dimanfaatkan sebagai alternatif pengganti nasi rendah karbohidrat atau bahan dasar adonan pizza.',
    funny: 'Kembang kol sebenarnya adalah sekumpulan kuncup bunga yang memutuskan untuk tidak mekar demi menemani makan malam Anda.',
    professional: 'Brassica oleracea var. botrytis (kembang kol) kaya akan kolin yang mendukung perkembangan otak dan fungsi kognitif.',
    casual: 'Kembang kol pas banget buat yang lagi diet rendah karbo karena bisa disulap jadi pengganti nasi!'
  },
  chilli: {
    normal: 'Rasa pedas pada cabai disebabkan oleh zat kapsaisin yang dapat memicu pelepasan endorfin (hormon kebahagiaan).',
    funny: 'Cabai pedas karena mereka tidak ingin dimakan, namun manusia justru menganggap rasa sakit itu sangat nikmat.',
    professional: 'Kapsaisinoid dalam Capsicum (cabai) terbukti meningkatkan metabolisme tubuh dan membantu meredakan rasa sakit secara topikal.',
    casual: 'Rasa pedas cabai itu gara-gara senyawa bernama kapsaisin. Sensasi pedasnya bikin nagih!'
  },
  corn: {
    normal: 'Setiap tongkol jagung biasanya memiliki jumlah baris biji yang genap, dan rata-rata berkisar antara 800 biji per tongkol.',
    funny: 'Jagung memiliki rambut yang indah di ujung tongkolnya, tetapi mereka tidak pernah pergi ke salon.',
    professional: 'Zea mays (jagung) kaya akan lutein dan zeaksantin yang berperan penting dalam memelihara kesehatan makula mata.',
    casual: 'Tahu gak? Jumlah baris biji di satu tongkol jagung itu selalu genap lho. Coba deh iseng hitung!'
  },
  cucumber: {
    normal: 'Mentimun mengandung sekitar 95% air, menjadikannya sayuran yang sangat baik untuk menghidrasi tubuh di cuaca panas.',
    funny: 'Mentimun sangat dingin karena suhunya bisa 20 derajat lebih rendah daripada udara di sekitarnya. Keren kan?',
    professional: 'Cucumis sativus (mentimun) mengandung lignan yang dikaitkan dengan penurunan risiko penyakit kardiovaskular.',
    casual: 'Mentimun itu isinya 95% air, jadi pas banget buat ngadem dan ngehidrasi tubuh pas cuaca lagi panas.'
  },
  eggplant: {
    normal: 'Secara botani, terong termasuk dalam kategori buah beri besar karena memiliki biji kecil yang dapat dimakan di dalamnya.',
    funny: 'Terong dalam bahasa Inggris disebut eggplant karena varietas lamanya berbentuk oval bulat telur berwarna putih.',
    professional: 'Solanum melongena (terong) mengandung nasunin pada kulitnya, sebuah antioksidan kuat yang melindungi membran sel otak.',
    casual: 'Secara botani terong itu buah beri lho, bukan sayur. Kulit ungunya punya antioksidan bagus buat otak.'
  },
  garlic: {
    normal: 'Bawang putih mengandung alisin yang memiliki sifat antibakteri dan antivirus alami yang sangat kuat.',
    funny: 'Bawang putih sangat efektif untuk mengusir vampir dan terkadang juga bisa mengusir teman dekat karena bau mulut Anda.',
    professional: 'Senyawa organosulfur alisin dalam Allium sativum (bawang putih) memberikan efek kardioprotektif yang signifikan.',
    casual: 'Bawang putih punya senyawa alisin yang ampuh banget buat ngelawan bakteri dan virus. Multifungsi abis!'
  },
  ginger: {
    normal: 'Jahe telah digunakan selama ribuan tahun sebagai obat herbal alami untuk mengatasi mual dan gangguan pencernaan.',
    funny: 'Jahe hangat bisa menghangatkan tenggorokan Anda sekaligus memberikan tendangan pedas yang mengejutkan.',
    professional: 'Gingerol dalam Zingiber officinale (jahe) menunjukkan aktivitas anti-inflamasi dan anti-emetik yang kuat.',
    casual: 'Jahe emang andalan dari dulu buat angetin badan dan ngilangin mual. Cocok diminum pas lagi masuk angin.'
  },
  lettuce: {
    normal: 'Selada mengandung zat laktukarium ringan yang dapat memberikan efek relaksasi dan membantu tidur lebih nyenyak.',
    funny: 'Selada adalah bahan salad yang paling pasrah karena tugas utamanya hanya menjadi alas bagi bahan lainnya.',
    professional: 'Lactuca sativa (selada) mengandung fitonutrien larut air dan mineral mikro yang mendukung kesehatan seluler.',
    casual: 'Makan selada bisa bikin rileks lho karena ada kandungan laktukarium yang bantu kita tidur lebih nyenyak.'
  },
  onion: {
    normal: 'Bawang merah mengeluarkan gas sin-propanetial-S-oksida saat dipotong yang memicu kelenjar air mata untuk menangis.',
    funny: 'Bawang merah adalah satu-satunya sayuran yang bisa membuat Anda menangis sedih tanpa harus patah hati terlebih dahulu.',
    professional: 'Allium cepa (bawang merah) kaya akan kuersetin, sebuah flavonoid bioaktif yang berperan sebagai anti-inflamasi.',
    casual: 'Gas yang keluar pas kita iris bawang merah itu yang bikin mata perih dan nangis. Jurus rahasia bawang!'
  },
  peas: {
    normal: 'Kacang polong adalah salah satu sayuran pertama yang berhasil diawetkan dengan metode pembekuan secara komersial.',
    funny: 'Kacang polong sangat kompak, mereka selalu tinggal beramai-ramai di dalam satu kantung hijau yang sempit.',
    professional: 'Pisum sativum (kacang polong) menyediakan protein nabati berkualitas tinggi serta serat larut untuk mikrobioma usus.',
    casual: 'Kacang polong itu kaya protein nabati dan serat. Seru banget kan makannya yang kecil-kecil bulet gitu.'
  },
  potato: {
    normal: 'Kentang adalah tanaman pangan non-serealia yang paling banyak dibudidayakan dan dikonsumsi di seluruh dunia.',
    funny: 'Kentang adalah sayuran paling berbakat karena bisa berubah menjadi kentang goreng, keripik, maupun perkedel lezat.',
    professional: 'Solanum tuberosum (kentang) merupakan sumber pati resisten dan kalium yang mendukung regulasi tekanan darah.',
    casual: 'Kentang itu sumber energi karbohidrat yang fleksibel banget, bisa diolah jadi kentang goreng sampai perkedel!'
  },
  turnip: {
    normal: "Lobak adalah sayuran akar kuno yang sering digunakan sebagai lentera Jack-o'-lantern pertama di Irlandia sebelum labu.",
    funny: 'Sebelum labu mengambil alih Halloween, orang-orang zaman dulu mengukir wajah seram pada lobak yang keras.',
    professional: 'Brassica rapa subsp. rapa (lobak) mengandung glukosinolat tinggi yang mendukung fungsi detoksifikasi fase II hati.',
    casual: 'Dulu sebelum ada labu, orang Irlandia bikin lentera Halloween pakai lobak diukir lho. Unik banget!'
  },
  soybean: {
    normal: 'Kedelai adalah satu-satunya tanaman pangan yang mengandung semua sembilan asam amino esensial bagi manusia.',
    funny: 'Kedelai adalah pahlawan di balik tahu, tempe, dan kecap manis kesukaan Anda. Tanpanya makanan kita hambar.',
    professional: 'Glycine max (kedelai) kaya akan isoflavon seperti genistein dan daidzein yang berfungsi sebagai fitoestrogen alami.',
    casual: 'Kedelai itu lengkap banget karena punya semua asam amino esensial. Bahan dasar tempe-tahu andalan kita!'
  },
  spinach: {
    normal: 'Bayam kaya akan zat besi, kalsium, dan vitamin K yang penting untuk kesehatan tulang dan produksi sel darah merah.',
    funny: 'Bayam terkenal berkat kartun Popeye, meskipun makan bayam tidak akan langsung membuat otot Anda membesar instan.',
    professional: 'Spinacia oleracea (bayam) mengandung lutein konsentrasi tinggi serta zat besi non-heme yang memerlukan vitamin C untuk absorpsi optimal.',
    casual: 'Bayam punya zat besi dan kalsium melimpah. Pas banget dikonsumsi bareng vitamin C biar penyerapannya makin jos!'
  }
};

class RootFactsService {
  constructor() {
    this.generator = null;
    this.isModelLoaded = false;
    this.isGenerating = false;
    this.config = null;
    this.currentBackend = null;
    this.currentTone = 'normal';
    this.isFallbackMode = false;
  }

  // TODO [Basic] Muat model dan inisialisasi pipeline text2text-generation
  // TODO [Advance] Implementasikan strategi Backend Adaptive
  async loadModel(onProgress) {
    try {
      // Backend Adaptive strategy: WebGPU -> WASM/CPU fallback
      let chosenDevice = 'wasm';

      const makeProgressCallback = () => (info) => {
        if (info.status === 'progress' && typeof onProgress === 'function') {
          onProgress(info.progress);
        }
      };

      if (typeof navigator !== 'undefined' && 'gpu' in navigator) {
        try {
          this.generator = await pipeline(
            'text2text-generation',
            MODEL_NAME,
            {
              device: 'webgpu',
              progress_callback: makeProgressCallback(),
            },
          );
          chosenDevice = 'webgpu';
          console.log('Transformers.js loaded with WebGPU backend.');
        } catch (e) {
          console.warn('Transformers.js WebGPU failed, falling back to wasm/CPU:', e);
          this.generator = await pipeline(
            'text2text-generation',
            MODEL_NAME,
            {
              device: 'wasm',
              progress_callback: makeProgressCallback(),
            },
          );
          chosenDevice = 'wasm';
        }
      } else {
        this.generator = await pipeline(
          'text2text-generation',
          MODEL_NAME,
          {
            device: 'wasm',
            progress_callback: makeProgressCallback(),
          },
        );
        chosenDevice = 'wasm';
      }
      this.currentBackend = chosenDevice;
      this.isModelLoaded = true;
      this.isFallbackMode = false;
    } catch (error) {
      console.warn('Gagal memuat model online (kemungkinan offline/terblokir), mengaktifkan mode fallback lokal:', error);
      // Aktifkan mode fallback agar inisialisasi aplikasi tidak gagal dan kamera tetap bisa aktif
      this.isModelLoaded = true;
      this.isFallbackMode = true;
      this.currentBackend = 'offline-fallback';

      if (typeof onProgress === 'function') {
        onProgress(100);
      }
    }
  }

  // TODO [Advance] Konfigurasi tone fakta yang dihasilkan
  setTone(tone) {
    const validTones = ['normal', 'funny', 'professional', 'casual'];
    if (validTones.includes(tone)) {
      this.currentTone = tone;
    }
  }

  // TODO [Basic] Lakukan prediksi pada elemen gambar yang diberikan dan kembalikan hasilnya
  // TODO [Basic] Tambahkan validasi untuk maksimum panjang input dan pembersihan input terhadap karakter khusus untuk mengatasi prompt injection
  // TODO [Skilled] Konfigurasikan parameter generasi berdasarkan kebutuhan
  // TODO [Advance] Implemenasikan parameter tone untuk mengatur nada fakta yang dihasilkan
  async generateFacts(vegetable, tone = 'normal') {
    if (!this.isModelLoaded) {
      throw new Error('Model belum dimuat.');
    }

    if (!vegetable || typeof vegetable !== 'string') {
      throw new Error('Input sayuran harus berupa string.');
    }

    // Basic: Validation for maximum input length to prevent prompt injection
    if (vegetable.length > 30) {
      throw new Error('Input terlalu panjang (maksimal 30 karakter).');
    }

    // Basic: Input sanitization from special characters to prevent prompt injection
    const sanitizedInput = vegetable.replace(/[^a-zA-Z0-9\s-]/g, '').trim();
    if (!sanitizedInput) {
      throw new Error('Input tidak valid setelah dibersihkan.');
    }

    // Mode offline/fallback lokal
    if (this.isFallbackMode) {
      const key = sanitizedInput.toLowerCase();
      const tones = FALLBACK_FACTS[key] || {
        normal: `Sayuran ${sanitizedInput} memiliki banyak kandungan nutrisi yang sangat baik untuk kesehatan tubuh kita!`,
        funny: `Sayuran ${sanitizedInput} sangat hebat sampai-sampai model AI kami pun terpukau!`,
        professional: `Kandungan nutrisi dalam ${sanitizedInput} memberikan kontribusi positif terhadap kesehatan tubuh.`,
        casual: `Sayur ${sanitizedInput} ini banyak banget manfaatnya lho!`
      };

      // Simulasi delay sedikit agar transisi UI terasa mulus
      await new Promise((resolve) => setTimeout(resolve, 800));
      return tones[tone] || tones.normal;
    }

    this.isGenerating = true;

    try {
      // Advanced: Generate facts based on the selected tone using English prompts
      // (Model is trained in English; using English prompts prevents hallucination)
      let prompt = '';
      switch (tone) {
      case 'funny':
        prompt = `Write a short funny and amusing fun fact about the vegetable ${sanitizedInput} in 1-2 sentences.`;
        break;
      case 'professional':
        prompt = `Write a short scientific and educational fun fact about the vegetable ${sanitizedInput} in 1-2 sentences.`;
        break;
      case 'casual':
        prompt = `Write a short casual and friendly fun fact about the vegetable ${sanitizedInput} in 1-2 sentences.`;
        break;
      case 'normal':
      default:
        prompt = `Write a short interesting fun fact about the vegetable ${sanitizedInput} in 1-2 sentences.`;
        break;
      }

      // Skilled: Generation configuration parameters
      const output = await this.generator(prompt, {
        max_new_tokens: 120,
        temperature: 0.7,
        top_p: 0.9,
        repetition_penalty: 1.2,
        do_sample: true,
      });

      let fact = output[0]?.generated_text || '';

      if (fact.toLowerCase().startsWith(prompt.toLowerCase())) {
        fact = fact.substring(prompt.length).trim();
      }

      if (!fact) {
        fact = `Sayuran ${sanitizedInput} memiliki banyak kandungan nutrisi yang sangat baik untuk kesehatan tubuh kita!`;
      }

      return fact;
    } catch (error) {
      console.error('Gagal melakukan generate fakta:', error);
      throw error;
    } finally {
      this.isGenerating = false;
    }
  }

  // TODO [Basic] Periksa apakah model sudah dimuat dan siap digunakan
  isReady() {
    return this.isModelLoaded && !this.isGenerating;
  }
}

export default RootFactsService;
