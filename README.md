# Dafnil - Aplikasi Penilaian Siswa SD (Mobile-First)

Aplikasi Penilaian Siswa berbasis **Mobile-First** yang dirancang khusus untuk guru SD (Kelas 4, Kelas 5, dan Kelas 6) untuk mengelola data siswa, lingkup materi, tujuan pembelajaran (TP), penilaian harian, rekapitulasi nilai per semester, hingga ekspor laporan Excel siap cetak.

---

## 📱 Fitur Utama

1. **Mobile-First Smartphone Mockup**:
   - Tampilan smartphone modern di tengah layar desktop dengan layout bersih.
   - Animasi latar belakang **Atmosphere Engine** (Meteor Jatuh 🌠, Hujan Badai ⛈️, Salju Dingin ❄️) yang berganti secara dinamis setiap 10 detik dan ter-clipping sempurna di dalam layar HP.
2. **Kustomisasi Logo & Icon**:
   - Fitur unggah file logo sekolah sendiri (`.png`, `.jpg`, `.svg`).
   - Fitur kustomisasi icon navigasi bawah (Beranda, Siswa, Penilaian, Rekap) dengan upload gambar sendiri di menu Pengaturan.
3. **Multi-Rombel Kelas**:
   - Kelas 4: Kelas 4 Utsman (dapat ditambah/diedit).
   - Kelas 5: Kelas 5 Umar, Kelas 5 Hasan, Kelas 5 Jafar.
   - Kelas 6: Kelas 6 Ali, Kelas 6 Abu Bakar.
   - Manajemen rombel dinamis (tambah, ubah nama, dan hapus).
4. **Pengolahan Siswa Lengkap**:
   - Tambah manual, edit, dan hapus siswa.
   - **Import Siswa dari Excel** (`.xlsx`, `.xls`, `.csv`) dengan deteksi kolom cerdas.
   - **Hapus Sebagian Siswa dengan Ceklis (Batch Delete)**.
   - **Hapus Semua Siswa per Rombel** tanpa merusak data rombel lain.
5. **Kurikulum Lingkup Materi & TP**:
   - 8 Lingkup Materi (LM 1–4 untuk Semester 1, LM 5–8 untuk Semester 2).
   - Masing-masing 4 TP (total 32 TP per tahun ajaran).
   - Judul LM dan TP dapat disesuaikan dan diedit kapan saja.
6. **Penilaian & Validasi**:
   - Skala nilai 0–100 dengan validasi numerik otomatis dan indikator warna.
   - Autosave real-time ke penyimpanan lokal browser (`localStorage`).
7. **Rekapitulasi Nilai Akurat**:
   - Menghitung rata-rata semester secara otomatis dengan mengabaikan nilai TP yang belum diisi (tidak dianggap 0).
8. **Export Excel Siap Cetak (`.xlsx`)**:
   - Export Semester 1, Export Semester 2, atau Export Semua Semester (Multi-sheet).
   - Dilengkapi kop identitas sekolah & guru, header bertingkat, orientasi Landscape, auto column width, dan kolom tanda tangan Kepala Sekolah & Guru.

---

## 📂 Struktur Berkas

```
├── index.html        # UI Utama Aplikasi (SPA Mobile-First)
├── README.md         # Dokumentasi Aplikasi
├── .gitignore        # Berkas pengecualian Git
├── css/
│   └── style.css     # Design system, glassmorphism, responsive canvas & phone frame
└── js/
    ├── storage.js    # StorageManager & LocalStorage Persistence
    ├── stars.js      # AtmosphereEngine (Meteor, Badai, Salju, Stars)
    ├── excel.js      # ExcelExporter menggunakan SheetJS
    └── app.js        # Controller utama SPA, router & event handlers
```

---

## 🚀 Cara Menjalankan

Cukup buka berkas `index.html` menggunakan peramban web modern (Google Chrome, Microsoft Edge, Mozilla Firefox, Safari). Tidak memerlukan dependensi server backend khusus.
