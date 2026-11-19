// ==========================================================================
// STATIC CACHE DATA NEUTRALIZED (REALTIME DATABASE DRIVEN)
// ==========================================================================
// Berkas ini dinonaktifkan demi mendukung sinkronisasi data riil 100% dari
// Google Spreadsheet Database dan live API (tanpa hardcode/dummy).

const GOOGLE_PHOTOS_INITIAL_CACHE = [];
const KING_PHOTOBOOTH_INITIAL_CACHE = [];
const WEDDING_INITIAL_CACHE = [];

if (typeof window !== "undefined") {
  window.GOOGLE_PHOTOS_INITIAL_CACHE = [];
  window.KING_PHOTOBOOTH_INITIAL_CACHE = [];
  window.WEDDING_INITIAL_CACHE = [];
}
