# STATUS REVISI SISTEM (revisi.md) - v4.28.0
================================================================================
STATUS: SELESAI DITERAPKAN (MERGED TO MASTER CONTEXT & PRD v4.28.0)
PERMINTAAN: Perbaiki input 'Logo Acara / Monogram' yang kembali kosong setelah disimpan saat admin login kembali.
TANGGAL PENGAJUAN: 21 November 2026
VERSI TARGET: v4.28.0-PROD
================================================================================

## 1. Analisis Akar Masalah (Root Cause Analysis)

1. **Tertimpa Nilai Kosong (Wipeout) dari `Daftar_Acara`**:
   - Nilai logo berhasil tersimpan di sheet `Pengaturan`, namun kolom `Logo_Acara` pada sheet `Daftar_Acara` bernilai kosong (`null`).
   - Saat halaman memuat ulang atau sinkronisasi GViz dijalankan, pembacaan mengekstrak `logoUrl: ""` dan menimpa variabel `state.activeConfig.EVENT_LOGO_URL`.
2. **Ketiadaan Pemetaan Form di `populateConfigToUI`**:
   - Elemen `#cfgEventLogoUrl` tidak diperbarui saat konfigurasi dimuat kembali ke antarmuka.
3. **Reset Nilai di `openAdminSettingsModal`**:
   - Membaca objek event yang terlanjur ter-reset kosong dari poin 1, sehingga kotak isian formulir tampil kosong dan pratinjau kembali ke ikon cincin (`💍`).

---

## 2. Tindakan yang Telah Diterapkan

1. **[js/app.js](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/js/app.js)**:
   - **Anti-Wipeout Bertingkat:** Jika kolom `Logo_Acara` di `Daftar_Acara` kosong, sistem otomatis mempertahankan logo dari `existingEv.logoUrl`, `sheetMap.EVENT_LOGO_URL`, atau `state.activeConfig.EVENT_LOGO_URL`. Tidak ada lagi penimpaan dengan string kosong `""`.
   - **Form Mapping:** Menghubungkan pengisian elemen `#cfgEventLogoUrl` dan thumbnail pratinjau (`updateAdminLogoPreview()`) di `populateConfigToUI()`.
   - **Modal Admin:** Menjamin `openAdminSettingsModal()` dan `populateAdminInputsForActiveEvent()` selalu memuat logo tersimpan ke input field.
2. **[code.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/code.gs), [setup.gs](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/setup.gs), & [config.json](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/config.json)**:
   - Menyertakan URL logo resmi `https://drive.google.com/file/d/1tsZZc6y_0xiCVWunfPiEN_eQdAsjJP_B/view?usp=drivesdk` untuk event `wilson-felicia-133`.
   - Sinkronisasi API langsung ke live spreadsheet database.
3. **[prd.md](file:///c:/Users/Administrator/.gemini/antigravity-ide/project/wedding-panggung/prd.md)**:
   - Diperbarui ke `v4.28.0-PROD` (Seksi 2.28).

---

## 3. Hasil Pengujian & Verifikasi (Test Results)

1. **Unit & Regression Test Suites**:
   - `scratch/test_logo_persistence.js`: **5/5 PASS**
   - `scratch/test_all_browsers_3_events.js`: **4/4 PASS**
   - `scratch/test_discrepancy_fix.js`: **5/5 PASS**
   - Sintaks JavaScript `node --check js/app.js`: **0 Error (Exit Code 0)**
   - **Total: 100% PASS**

2. **Jaminan Antarmuka Pengguna**:
   - Kotak isian *"Logo Acara / Monogram (Link Google Drive / URL Gambar)"* kini **tetap terisi penuh** dengan URL logo yang disimpan saat login kembali.
   - Kotak pratinjau di samping input menampilkan gambar logo aktif (bukan ikon cincin default `💍`).
