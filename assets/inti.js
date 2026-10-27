/* =====================================================================
 * Form Ulasan by itekno.id — inti bersama (builder & form publik)
 * Berisi: pengaturan situs, pilihan tema, template siap pakai,
 * pembersih konfigurasi (keamanan) dan perhitungan skor.
 * ===================================================================== */
(function (W) {
  'use strict';

  /* ---------- Pengaturan situs (ubah sesuai repo Anda) ---------- */
  const SITUS = {
    nama: 'Form Ulasan',
    merek: 'itekno.id',
    merekUrl: 'https://itekno.id',
    // ID Google Sheet template (yang berisi script). Klien akan membuat salinannya.
    // Contoh: https://docs.google.com/spreadsheets/d/<ID_INI>/edit
    templateSheetId: 'ISI_ID_SHEET_TEMPLATE',
    // Nomor WhatsApp admin itekno.id untuk pembelian lisensi (format 62…, tanpa + atau spasi)
    adminWa: 'ISI_NOMOR_WA',
    // Kunci PUBLIK pemeriksa lisensi (dari alat admin lisensi). Sama dengan KUNCI_PUBLIK_N di Code.gs.
    kunciPublikN: 'ISI_KUNCI_PUBLIK',
    batasUji: 3             // jumlah ulasan pada mode uji coba
  };

  /* ---------- Pilihan tampilan ---------- */
  const FONT = {
    modern:  { nama: 'Modern',  judul: 'Poppins',           isi: 'Inter',     url: 'family=Poppins:wght@500;600;700&family=Inter:wght@400;500;600' },
    elegan:  { nama: 'Elegan',  judul: 'Playfair Display',  isi: 'Lato',      url: 'family=Playfair+Display:wght@600;700&family=Lato:wght@400;700' },
    ramah:   { nama: 'Ramah',   judul: 'Nunito',            isi: 'Nunito',    url: 'family=Nunito:wght@400;600;700;800' },
    rapi:    { nama: 'Rapi',    judul: 'Plus Jakarta Sans', isi: 'Plus Jakarta Sans', url: 'family=Plus+Jakarta+Sans:wght@400;500;600;700' },
    klasik:  { nama: 'Klasik',  judul: 'DM Serif Display',  isi: 'DM Sans',   url: 'family=DM+Serif+Display&family=DM+Sans:wght@400;500;700' }
  };
  const LATAR = {
    gelombang: 'Gelombang', titik: 'Titik-titik', gradien: 'Gradien', bentuk: 'Bentuk melayang', polos: 'Polos'
  };
  const SUDUT = { bulat: 'Bulat', sedang: 'Sedang', kotak: 'Tegas' };
  const WARNA_CEPAT = ['#d71920', '#e8590c', '#f59f00', '#2b8a3e', '#0c8599', '#1971c2', '#5f3dc4', '#c2255c', '#6b4226', '#212529'];

  const TIPE = {
    kontak:      { nama: 'Data diri',            ikon: '👤', rating: false },
    bintang:     { nama: 'Rating bintang',       ikon: '⭐', rating: true },
    emoji:       { nama: 'Rating emoji',         ikon: '😊', rating: true },
    bintangItem: { nama: 'Bintang per item',     ikon: '📋', rating: true },
    nps:         { nama: 'Skala rekomendasi 0–10', ikon: '📈', rating: true },
    tunggal:     { nama: 'Pilihan (satu)',       ikon: '🔘', rating: false },
    ganda:       { nama: 'Pilihan (boleh banyak)', ikon: '☑️', rating: false },
    singkat:     { nama: 'Jawaban singkat',      ikon: '✏️', rating: false },
    panjang:     { nama: 'Jawaban panjang',      ikon: '📝', rating: false }
  };
  const LABEL_BINTANG = ['Sangat buruk', 'Kurang', 'Cukup', 'Baik', 'Sangat baik'];
  const EMOJI = ['😠', '😕', '😐', '🙂', '😍'];
  const MAKS_PERTANYAAN = 20;

  /* ---------- Pembuat pertanyaan ---------- */
  let _n = 0;
  const id = () => 'q' + Date.now().toString(36).slice(-4) + (++_n).toString(36);
  const Q = {
    kontak: (judul, o = {}) => ({ id: id(), tipe: 'kontak', judul: judul || 'Kenalan dulu, yuk', ket: o.ket || 'Agar kami bisa menghubungi Anda bila diperlukan.', wajib: true,
      kontak: Object.assign({ nama: { tampil: true, wajib: true }, hp: { tampil: true, wajib: false }, email: { tampil: false, wajib: false }, instansi: { tampil: false, wajib: false } }, o.kontak || {}),
      labelInstansi: o.labelInstansi || 'Perusahaan / Instansi' }),
    bintang: (judul, ket, alasan) => ({ id: id(), tipe: 'bintang', judul, ket: ket || '', wajib: true, tanyaAlasan: !!alasan, alasan: alasan || [] }),
    emoji: (judul, ket, alasan) => ({ id: id(), tipe: 'emoji', judul, ket: ket || '', wajib: true, tanyaAlasan: !!alasan, alasan: alasan || [] }),
    item: (judul, item, ket) => ({ id: id(), tipe: 'bintangItem', judul, ket: ket || 'Ketuk bintang untuk tiap bagian.', wajib: true, item }),
    nps: (judul, ket) => ({ id: id(), tipe: 'nps', judul, ket: ket || '0 = tidak mungkin, 10 = sangat mungkin', wajib: false, tanyaAlasan: false, alasan: [] }),
    tunggal: (judul, opsi, ket, wajib) => ({ id: id(), tipe: 'tunggal', judul, ket: ket || '', wajib: wajib !== false, opsi }),
    ganda: (judul, opsi, ket) => ({ id: id(), tipe: 'ganda', judul, ket: ket || 'Boleh pilih lebih dari satu.', wajib: false, opsi }),
    singkat: (judul, ket, ph) => ({ id: id(), tipe: 'singkat', judul, ket: ket || '', wajib: false, placeholder: ph || 'Tulis jawaban Anda' }),
    panjang: (judul, ket, ph) => ({ id: id(), tipe: 'panjang', judul, ket: ket || '', wajib: false, placeholder: ph || 'Tulis di sini…' })
  };
  function pertanyaanBaru(tipe) {
    switch (tipe) {
      case 'kontak': return Q.kontak();
      case 'bintang': return Q.bintang('Bagaimana penilaian Anda?', '', ['Pelayanan', 'Harga', 'Kebersihan', 'Waktu tunggu']);
      case 'emoji': return Q.emoji('Bagaimana perasaan Anda hari ini?', '', ['Pelayanan', 'Harga', 'Kenyamanan']);
      case 'bintangItem': return Q.item('Nilai setiap bagian berikut', ['Pelayanan', 'Kualitas', 'Harga']);
      case 'nps': return Q.nps('Seberapa mungkin Anda merekomendasikan kami ke teman?');
      case 'tunggal': return Q.tunggal('Pertanyaan pilihan', ['Pilihan 1', 'Pilihan 2', 'Pilihan 3']);
      case 'ganda': return Q.ganda('Pertanyaan pilihan ganda', ['Pilihan 1', 'Pilihan 2', 'Pilihan 3']);
      case 'singkat': return Q.singkat('Pertanyaan singkat');
      default: return Q.panjang('Ada kesan atau saran untuk kami?', '', 'Ceritakan pengalaman Anda…');
    }
  }

  const SELESAI_DASAR = {
    puas:   { judul: 'Terima kasih, {nama}!', pesan: 'Senang sekali Anda puas. Sampai jumpa lagi!' },
    sedang: { judul: 'Terima kasih atas masukannya', pesan: 'Kami akan terus berbenah agar pengalaman Anda berikutnya lebih baik.' },
    buruk:  { judul: 'Mohon maaf atas ketidaknyamanannya', pesan: 'Masukan Anda sangat berarti. Kami akan segera memperbaikinya.' },
    netral: { judul: 'Terima kasih, {nama}!', pesan: 'Jawaban Anda sudah kami terima.' }
  };

  /* ---------- Template siap pakai ---------- */
  const TEMPLATE = {
    kafe: {
      nama: 'Kafe & Resto', ikon: '☕', desk: 'Rasa, pelayanan, suasana',
      buat: () => ({
        brand: { nama: 'Kopi Senja', tagline: 'Ngopi santai, cerita hangat', ikon: '☕' },
        tema: { warna: '#6b4226', latar: '#f7f1ea', gaya: 'bentuk', font: 'elegan', sudut: 'bulat' },
        sambutan: { judul: 'Bagaimana kunjungan Anda hari ini?', teks: 'Hanya 1 menit. Ulasan Anda membantu kami menyajikan yang terbaik.', tombol: 'Mulai beri ulasan' },
        pertanyaan: [
          Q.emoji('Secara keseluruhan, bagaimana pengalaman Anda?', '', ['Rasa', 'Pelayanan', 'Harga', 'Kebersihan', 'Waktu tunggu', 'Suasana']),
          Q.item('Nilai setiap bagian berikut', ['Rasa makanan & minuman', 'Keramahan barista', 'Kecepatan penyajian', 'Kebersihan tempat']),
          Q.ganda('Menu apa yang Anda pesan?', ['Kopi', 'Non-kopi', 'Makanan berat', 'Camilan', 'Dessert']),
          Q.panjang('Ada kesan atau saran untuk kami?', '', 'Ceritakan pengalaman Anda…'),
          Q.kontak('Boleh kenalan?', { ket: 'Opsional — untuk promo & info menu baru.', kontak: { nama: { tampil: true, wajib: false }, hp: { tampil: true, wajib: false } } })
        ],
        selesai: { puas: { judul: 'Terima kasih, {nama}! ☕', pesan: 'Senang Anda menikmati kunjungan hari ini. Sampai bertemu di cangkir berikutnya!' },
          tombol: [{ label: 'Ulas kami di Google Maps', url: 'https://maps.google.com' }, { label: 'Ikuti Instagram kami', url: 'https://instagram.com' }] }
      })
    },
    klinik: {
      nama: 'Klinik & Kecantikan', ikon: '🩺', desk: 'Pelayanan, tenaga medis, fasilitas',
      buat: () => ({
        brand: { nama: 'Klinik Sehat Ceria', tagline: 'Peduli setiap senyum Anda', ikon: '🩺' },
        tema: { warna: '#0c8599', latar: '#eef8fa', gaya: 'gelombang', font: 'rapi', sudut: 'bulat' },
        sambutan: { judul: 'Bagaimana pengalaman perawatan Anda?', teks: 'Penilaian Anda membantu kami memberikan pelayanan yang lebih nyaman.', tombol: 'Mulai' },
        pertanyaan: [
          Q.kontak('Data pasien', { ket: 'Agar kami dapat menindaklanjuti masukan Anda.' }),
          Q.tunggal('Layanan apa yang Anda terima hari ini?', ['Konsultasi dokter', 'Perawatan wajah', 'Perawatan gigi', 'Pemeriksaan umum', 'Lainnya']),
          Q.item('Berikan penilaian Anda', ['Keramahan resepsionis', 'Penjelasan dokter/terapis', 'Waktu tunggu', 'Kebersihan & kenyamanan ruangan']),
          Q.nps('Seberapa mungkin Anda merekomendasikan klinik kami?'),
          Q.panjang('Saran untuk kami', '', 'Tuliskan saran Anda…')
        ],
        selesai: { tombol: [{ label: 'Jadwalkan kunjungan berikutnya', url: 'https://wa.me/' }] }
      })
    },
    toko: {
      nama: 'Toko & Retail', ikon: '🛍️', desk: 'Produk, harga, kasir',
      buat: () => ({
        brand: { nama: 'Toko Berkah', tagline: 'Belanja hemat, hati senang', ikon: '🛍️' },
        tema: { warna: '#e8590c', latar: '#fff4ec', gaya: 'titik', font: 'ramah', sudut: 'bulat' },
        sambutan: { judul: 'Puas belanja di sini?', teks: 'Bantu kami jadi lebih baik dengan 3 pertanyaan singkat.', tombol: 'Ayo mulai' },
        pertanyaan: [
          Q.bintang('Bagaimana pengalaman belanja Anda?', '', ['Kelengkapan barang', 'Harga', 'Antrian kasir', 'Keramahan', 'Kebersihan']),
          Q.tunggal('Seberapa sering Anda belanja di sini?', ['Pertama kali', 'Kadang-kadang', 'Setiap minggu', 'Hampir setiap hari']),
          Q.singkat('Barang apa yang ingin Anda temukan di toko kami?', 'Opsional', 'Mis. produk tertentu'),
          Q.panjang('Kesan & saran')
        ],
        selesai: {}
      })
    },
    event: {
      nama: 'Event & Booth', ikon: '🎪', desk: 'Pengunjung, minat, kontak',
      buat: () => ({
        brand: { nama: 'Booth Kami', tagline: 'Pameran Bisnis 2026', ikon: '🎪' },
        tema: { warna: '#d71920', latar: '#f3f6fb', gaya: 'gelombang', font: 'modern', sudut: 'bulat' },
        sambutan: { judul: 'Terima kasih sudah mampir!', teks: 'Isi data singkat dan beri penilaian untuk booth kami.', tombol: 'Mulai' },
        pertanyaan: [
          Q.kontak('Silakan lengkapi data diri Anda', { ket: 'Tim kami akan menghubungi Anda untuk tindak lanjut.', kontak: { nama: { tampil: true, wajib: true }, hp: { tampil: true, wajib: true }, email: { tampil: true, wajib: false }, instansi: { tampil: true, wajib: true } } }),
          Q.ganda('Produk apa yang paling menarik bagi Anda?', ['Produk A', 'Produk B', 'Produk C', 'Konsultasi']),
          Q.bintang('Bagaimana penilaian Anda terhadap booth kami?', '', ['Penjelasan petugas', 'Materi kurang lengkap', 'Antrian', 'Tampilan booth']),
          Q.panjang('Ada yang ingin Anda tanyakan?', '', 'Tulis pertanyaan atau kebutuhan Anda…')
        ],
        selesai: { puas: { judul: 'Senang berkenalan, {nama}!', pesan: 'Tim kami akan segera menghubungi Anda.' }, tombol: [{ label: 'Lihat katalog produk', url: 'https://' }] }
      })
    },
    jasa: {
      nama: 'Jasa & Servis', ikon: '🛠️', desk: 'Bengkel, laundry, salon',
      buat: () => ({
        brand: { nama: 'Servis Kilat', tagline: 'Cepat, rapi, bergaransi', ikon: '🛠️' },
        tema: { warna: '#1971c2', latar: '#eef4fb', gaya: 'gradien', font: 'rapi', sudut: 'sedang' },
        sambutan: { judul: 'Bagaimana hasil layanan kami?', teks: 'Penilaian Anda membantu teknisi kami bekerja lebih baik.', tombol: 'Beri penilaian' },
        pertanyaan: [
          Q.bintang('Seberapa puas Anda dengan hasil pekerjaan?', '', ['Hasil kurang rapi', 'Terlalu lama', 'Harga', 'Komunikasi', 'Tidak sesuai janji']),
          Q.item('Nilai juga hal berikut', ['Ketepatan waktu', 'Kejelasan biaya', 'Keramahan petugas']),
          Q.nps('Seberapa mungkin Anda merekomendasikan kami?'),
          Q.kontak('Data pelanggan', { ket: 'Untuk konfirmasi garansi layanan.', kontak: { nama: { tampil: true, wajib: true }, hp: { tampil: true, wajib: false } } }),
          Q.panjang('Saran untuk kami')
        ],
        selesai: { tombol: [{ label: 'Hubungi kami via WhatsApp', url: 'https://wa.me/' }] }
      })
    },
    hotel: {
      nama: 'Hotel & Penginapan', ikon: '🏨', desk: 'Kamar, staf, fasilitas',
      buat: () => ({
        brand: { nama: 'Griya Asri', tagline: 'Rumah kedua Anda', ikon: '🏨' },
        tema: { warna: '#2b8a3e', latar: '#f0f7f1', gaya: 'bentuk', font: 'klasik', sudut: 'bulat' },
        sambutan: { judul: 'Bagaimana menginap Anda?', teks: 'Kami ingin setiap tamu merasa seperti di rumah.', tombol: 'Mulai' },
        pertanyaan: [
          Q.item('Penilaian selama menginap', ['Kebersihan kamar', 'Kenyamanan tempat tidur', 'Sarapan', 'Keramahan staf', 'Fasilitas']),
          Q.emoji('Secara keseluruhan, Anda merasa…', '', ['Kebersihan', 'Kebisingan', 'Air panas', 'Wi-Fi', 'Pelayanan']),
          Q.tunggal('Tujuan menginap', ['Liburan', 'Bisnis', 'Keluarga', 'Lainnya'], '', false),
          Q.panjang('Pesan untuk kami'),
          Q.kontak('Data tamu', { ket: 'Opsional.', kontak: { nama: { tampil: true, wajib: false }, email: { tampil: true, wajib: false }, hp: { tampil: false, wajib: false } } })
        ],
        selesai: { tombol: [{ label: 'Pesan kamar lagi', url: 'https://' }] }
      })
    },
    kosong: {
      nama: 'Mulai dari kosong', ikon: '✨', desk: 'Susun sendiri dari awal',
      buat: () => ({
        brand: { nama: 'Nama Usaha Anda', tagline: 'Tagline singkat', ikon: '⭐' },
        tema: { warna: '#5f3dc4', latar: '#f4f2fb', gaya: 'gelombang', font: 'modern', sudut: 'bulat' },
        sambutan: { judul: 'Bagaimana pengalaman Anda?', teks: 'Bantu kami jadi lebih baik.', tombol: 'Mulai' },
        pertanyaan: [Q.bintang('Bagaimana penilaian Anda?', '', ['Pelayanan', 'Harga', 'Kualitas']), Q.panjang('Ada kesan atau saran?')],
        selesai: {}
      })
    }
  };

  function cfgBaru(tpl) {
    const t = (TEMPLATE[tpl] || TEMPLATE.kosong).buat();
    return rapikan(Object.assign({ v: 1, template: tpl }, t));
  }

  /* ---------- Pembersih (dipakai builder, form publik & sebagai acuan server) ---------- */
  const str = (v, n, d) => { const s = typeof v === 'string' ? v.trim().slice(0, n) : ''; return s || (d === undefined ? '' : d); };
  const pilih = (v, obj, d) => Object.prototype.hasOwnProperty.call(obj, v) ? v : d;
  const warna = (v, d) => /^#[0-9a-f]{6}$/i.test(v || '') ? v.toLowerCase() : d;
  function amanUrl(u) {
    u = str(u, 600);
    if (/^https:\/\/[^\s"'<>`]+$/i.test(u)) return u;
    if (/^(tel:\+?[0-9 ()-]{4,20}|mailto:[^\s"'<>`]+@[^\s"'<>`]+)$/i.test(u)) return u;
    return '';
  }
  function amanGambar(u) {
    if (typeof u !== 'string') return '';
    if (/^data:image\/(png|jpeg|webp|gif);base64,[a-z0-9+/=]+$/i.test(u) && u.length < 220000) return u;
    if (/^https:\/\/[^\s"'<>`()]+$/i.test(u) && u.length < 600) return u;
    return '';
  }
  const daftar = (a, n, maks) => {
    if (!Array.isArray(a)) return [];
    const out = [];
    a.forEach(x => { const s = str(x, n); if (s && out.indexOf(s) < 0 && out.length < maks) out.push(s); });
    return out;
  };
  function rapikanQ(q) {
    if (!q || typeof q !== 'object' || !TIPE[q.tipe]) return null;
    const o = { id: /^[a-z0-9]{2,16}$/i.test(q.id || '') ? q.id : id(), tipe: q.tipe, judul: str(q.judul, 200, TIPE[q.tipe].nama), ket: str(q.ket, 300), wajib: !!q.wajib };
    if (q.tipe === 'kontak') {
      o.kontak = {}; ['nama', 'hp', 'email', 'instansi'].forEach(k => {
        const f = (q.kontak || {})[k] || {}; o.kontak[k] = { tampil: !!f.tampil, wajib: !!f.tampil && !!f.wajib };
      });
      if (!['nama', 'hp', 'email', 'instansi'].some(k => o.kontak[k].tampil)) o.kontak.nama.tampil = true;
      o.labelInstansi = str(q.labelInstansi, 60, 'Perusahaan / Instansi');
      o.wajib = Object.keys(o.kontak).some(k => o.kontak[k].wajib);
    }
    if (q.tipe === 'bintang' || q.tipe === 'emoji' || q.tipe === 'nps') {
      o.tanyaAlasan = !!q.tanyaAlasan; o.alasan = daftar(q.alasan, 60, 12);
      if (o.tanyaAlasan && !o.alasan.length) o.alasan = ['Pelayanan', 'Harga', 'Kualitas'];
    }
    if (q.tipe === 'bintangItem') { o.item = daftar(q.item, 80, 10); if (!o.item.length) o.item = ['Item 1']; }
    if (q.tipe === 'tunggal' || q.tipe === 'ganda') {
      o.opsi = daftar(q.opsi, 80, 15); if (!o.opsi.length) o.opsi = ['Pilihan 1', 'Pilihan 2'];
      o.lainnya = !!q.lainnya;
    }
    if (q.tipe === 'singkat' || q.tipe === 'panjang') o.placeholder = str(q.placeholder, 120, 'Tulis jawaban Anda');
    return o;
  }
  function rapikan(c) {
    c = c && typeof c === 'object' ? c : {};
    const b = c.brand || {}, t = c.tema || {}, s = c.sambutan || {}, se = c.selesai || {};
    const out = {
      v: 1, template: str(c.template, 20, 'kosong'),
      brand: { nama: str(b.nama, 60, 'Nama Usaha'), tagline: str(b.tagline, 100), logo: amanGambar(b.logo), ikon: str(b.ikon, 8, '⭐') },
      tema: { warna: warna(t.warna, '#5f3dc4'), latar: warna(t.latar, '#f4f2fb'), gaya: pilih(t.gaya, LATAR, 'gelombang'),
              font: pilih(t.font, FONT, 'modern'), sudut: pilih(t.sudut, SUDUT, 'bulat') },
      sambutan: { tampil: s.tampil !== false, judul: str(s.judul, 160, 'Bagaimana pengalaman Anda?'), teks: str(s.teks, 400), tombol: str(s.tombol, 30, 'Mulai') },
      pertanyaan: (Array.isArray(c.pertanyaan) ? c.pertanyaan : []).map(rapikanQ).filter(Boolean).slice(0, MAKS_PERTANYAAN),
      selesai: { animasi: se.animasi !== false, tombol: [] },
      opsi: { sekaliSehari: !!(c.opsi && c.opsi.sekaliSehari), tombolIsiLagi: !(c.opsi && c.opsi.tombolIsiLagi === false) },
      footer: str(c.footer, 200)
    };
    const ids = {}; out.pertanyaan.forEach(q => { while (ids[q.id]) q.id = id(); ids[q.id] = 1; });
    ['puas', 'sedang', 'buruk', 'netral'].forEach(k => {
      const x = se[k] || {};
      out.selesai[k] = { judul: str(x.judul, 120, SELESAI_DASAR[k].judul), pesan: str(x.pesan, 300, SELESAI_DASAR[k].pesan) };
    });
    (Array.isArray(se.tombol) ? se.tombol : []).slice(0, 4).forEach(x => {
      if (x && str(x.label, 50)) out.selesai.tombol.push({ label: str(x.label, 50), url: amanUrl(x.url) });
    });
    if (!out.pertanyaan.length) out.pertanyaan = [Q.bintang('Bagaimana penilaian Anda?')].map(rapikanQ);
    return out;
  }

  /* ---------- Skor & kategori ---------- */
  // Nilai rating dinormalkan ke skala 1–5 lalu dirata-rata.
  function skor(cfg, jawab) {
    const n = [];
    cfg.pertanyaan.forEach(q => {
      const v = jawab[q.id];
      if (q.tipe === 'bintang' || q.tipe === 'emoji') { if (v >= 1) n.push(+v); }
      else if (q.tipe === 'nps') { if (v !== undefined && v !== null && v !== '') n.push(1 + (+v) * 0.4); }
      else if (q.tipe === 'bintangItem' && v && typeof v === 'object') Object.keys(v).forEach(k => { if (v[k] >= 1) n.push(+v[k]); });
    });
    if (!n.length) return { rata: null, kategori: 'netral' };
    const rata = Math.round(n.reduce((a, b) => a + b, 0) / n.length * 10) / 10;
    return { rata, kategori: rata >= 4 ? 'puas' : rata >= 3 ? 'sedang' : 'buruk' };
  }

  /* ---------- Warna turunan ---------- */
  function hexRgb(h) { const n = parseInt(h.slice(1), 16); return [n >> 16 & 255, n >> 8 & 255, n & 255]; }
  function rgbHex(r) { return '#' + r.map(x => Math.max(0, Math.min(255, Math.round(x))).toString(16).padStart(2, '0')).join(''); }
  function campur(a, b, t) { const x = hexRgb(a), y = hexRgb(b); return rgbHex(x.map((v, i) => v + (y[i] - v) * t)); }
  function terang(h) { const [r, g, b] = hexRgb(h).map(v => { v /= 255; return v <= .03928 ? v / 12.92 : Math.pow((v + .055) / 1.055, 2.4); }); return .2126 * r + .7152 * g + .0722 * b; }
  function palet(t) {
    const p = t.warna;
    return {
      p, pGelap: campur(p, '#000000', .22), pLembut: campur(p, '#ffffff', .9), pSedang: campur(p, '#ffffff', .75),
      diAtasP: terang(p) > .45 ? '#1b1b1f' : '#ffffff', bg: t.latar, latarGelap: terang(t.latar) < .2
    };
  }

  const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

  // id deployment Apps Script dari URL /exec
  function idDariUrl(u) {
    const m = String(u || '').trim().match(/script\.google\.com\/(?:a\/macros\/[^/]+|macros)\/s\/([A-Za-z0-9_-]{20,})\/(?:exec|dev)/);
    return m ? m[1] : (/^[A-Za-z0-9_-]{30,}$/.test(String(u || '').trim()) ? String(u).trim() : '');
  }
  const urlApi = id => 'https://script.google.com/macros/s/' + id + '/exec';

  /* ---------- Lisensi ----------
   * FUL1.<data base64url>.<tanda tangan RSA-SHA256 base64url>
   * data: { i, e:email Gmail, d:ID deployment, n:nama usaha, x:berlaku s/d, w:watermark, t:terbit } */
  function b64uBytes(s) { s = s.replace(/-/g, '+').replace(/_/g, '/'); s += '==='.slice((s.length + 3) % 4); return Uint8Array.from(atob(s), c => c.charCodeAt(0)); }
  function bacaLisensi(lis) {
    const m = /^FUL1\.([A-Za-z0-9_-]+)\.([A-Za-z0-9_-]+)$/.exec(String(lis || '').replace(/\s+/g, ''));
    if (!m) return null;
    try { return { data: JSON.parse(new TextDecoder().decode(b64uBytes(m[1]))), pesan: m[1], sig: m[2] }; } catch (e) { return null; }
  }
  const hariIni = () => new Date(Date.now() + 7 * 3600e3).toISOString().slice(0, 10);   // WIB
  async function cekLisensi(lis, sid) {
    const L = bacaLisensi(lis);
    if (!L) return { sah: false, alasan: lis ? 'Format lisensi tidak dikenali' : 'Belum ada lisensi' };
    if (/^ISI_/.test(SITUS.kunciPublikN)) return { sah: false, alasan: 'Kunci publik belum diatur', data: L.data };
    try {
      const key = await crypto.subtle.importKey('jwk', { kty: 'RSA', n: SITUS.kunciPublikN, e: 'AQAB', alg: 'RS256', ext: true },
        { name: 'RSASSA-PKCS1-v1_5', hash: 'SHA-256' }, false, ['verify']);
      const ok = await crypto.subtle.verify('RSASSA-PKCS1-v1_5', key, b64uBytes(L.sig), new TextEncoder().encode(L.pesan));
      if (!ok) return { sah: false, alasan: 'Lisensi tidak sah', data: L.data };
    } catch (e) { return { sah: false, alasan: 'Lisensi tidak bisa diperiksa', data: L.data }; }
    if (sid && L.data.d !== sid) return { sah: false, alasan: 'Lisensi untuk form lain (ID berbeda)', data: L.data };
    if (L.data.x && hariIni() > L.data.x) return { sah: false, alasan: 'Lisensi berakhir ' + L.data.x, data: L.data, kedaluwarsa: true };
    return { sah: true, data: L.data };
  }
  function waAktivasi(o) {
    const t = ['Halo admin itekno.id, saya ingin ' + (o.perpanjang ? 'memperpanjang' : 'mengaktifkan') + ' *Form Ulasan*.', '',
      'Nama usaha: ' + (o.nama || '-'), 'Email Gmail: ' + (o.email || '-'), 'ID form: ' + (o.id || '-'), '', 'Mohon info harga & cara pembayarannya. Terima kasih.'].join('\n');
    return 'https://wa.me/' + String(SITUS.adminWa).replace(/\D/g, '') + '?text=' + encodeURIComponent(t);
  }

  // Kartu QR bermerek (perlu assets/qrcode.js)
  function kartuQR(cv, url, c) {
    const p = palet(c.tema);
    const q = qrcode(0, 'Q'); q.addData(url); q.make();
    const n = q.getModuleCount(), W = 900, H = 1200, cell = Math.floor(560 / n), qs = cell * n, qx = (W - qs) / 2, qy = 330;
    cv.width = W; cv.height = H; const x = cv.getContext('2d');
    x.fillStyle = '#ffffff'; x.fillRect(0, 0, W, H);
    const g = x.createLinearGradient(0, 0, W, 260); g.addColorStop(0, p.p); g.addColorStop(1, p.pGelap); x.fillStyle = g; x.fillRect(0, 0, W, 250);
    x.fillStyle = p.diAtasP; x.textAlign = 'center';
    x.font = `700 58px '${FONT[c.tema.font].judul}', sans-serif`; x.fillText(c.brand.nama.slice(0, 26), W / 2, 125);
    x.font = `400 32px '${FONT[c.tema.font].isi}', sans-serif`; x.globalAlpha = .9; x.fillText((c.brand.tagline || 'Bagikan pengalaman Anda').slice(0, 44), W / 2, 185); x.globalAlpha = 1;
    x.fillStyle = p.pLembut; rrect(x, qx - 40, qy - 40, qs + 80, qs + 80, 40); x.fill();
    x.fillStyle = '#ffffff'; rrect(x, qx - 20, qy - 20, qs + 40, qs + 40, 24); x.fill();
    x.fillStyle = '#111111';
    for (let r = 0; r < n; r++) for (let k = 0; k < n; k++) if (q.isDark(r, k)) x.fillRect(qx + k * cell, qy + r * cell, cell, cell);
    x.fillStyle = '#1d1f24'; x.font = `700 46px '${FONT[c.tema.font].judul}', sans-serif`; x.fillText('Pindai & beri ulasan', W / 2, qy + qs + 120);
    x.fillStyle = '#6b7280'; x.font = `400 30px '${FONT[c.tema.font].isi}', sans-serif`; x.fillText('Hanya 1 menit — terima kasih! ⭐', W / 2, qy + qs + 172);
    x.font = '400 22px Inter, sans-serif'; x.fillStyle = '#adb5bd'; x.fillText('Form Ulasan by itekno.id', W / 2, H - 40);
    const drawLogo = () => {
      const lx = W / 2 - 50, ly = qy + qs / 2 - 50;
      x.fillStyle = '#ffffff'; rrect(x, lx - 8, ly - 8, 116, 116, 24); x.fill();
      if (c.brand.logo) { const im = new Image(); im.onload = () => { const s = Math.min(100 / im.width, 100 / im.height); x.drawImage(im, W / 2 - im.width * s / 2, qy + qs / 2 - im.height * s / 2, im.width * s, im.height * s); }; im.src = c.brand.logo; }
      else { x.font = '70px serif'; x.textBaseline = 'middle'; x.fillText(c.brand.ikon, W / 2, qy + qs / 2 + 4); x.textBaseline = 'alphabetic'; }
    };
    drawLogo();
  }
  function rrect(x, a, b, w, h, r) { x.beginPath(); x.moveTo(a + r, b); x.arcTo(a + w, b, a + w, b + h, r); x.arcTo(a + w, b + h, a, b + h, r); x.arcTo(a, b + h, a, b, r); x.arcTo(a, b, a + w, b, r); x.closePath(); }


  W.FU = { SITUS, kartuQR, bacaLisensi, cekLisensi, waAktivasi, hariIni, FONT, LATAR, SUDUT, WARNA_CEPAT, TIPE, LABEL_BINTANG, EMOJI, MAKS_PERTANYAAN, TEMPLATE, SELESAI_DASAR,
           cfgBaru, rapikan, rapikanQ, pertanyaanBaru, skor, palet, campur, esc, amanUrl, amanGambar, idDariUrl, urlApi };
})(window);
