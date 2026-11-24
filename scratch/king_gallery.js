/* Gallery JS - public event page (fotoShare-style minimal)
   - Klik foto di galeri -> buka single-photo page (/i/{share_token})
     yang punya download/share/prev-next sendiri.
*/
(function () {
  'use strict';

  const grid = document.getElementById('gallery-grid');
  if (!grid) return;
  const likeCsrf = (typeof GALLERY_LIKE_CSRF === 'string') ? GALLERY_LIKE_CSRF : '';
  const loadMarker = document.getElementById('gallery-load-more');
  const loadStatus = document.getElementById('gallery-load-status');
  const totalItems = Array.isArray(ITEMS) ? ITEMS.length : 0;
  const batchSize = 24;
  let isRendering = false;
  let observer = null;
  let renderedCount = Math.min(
    typeof GALLERY_INITIAL_RENDER_COUNT === 'number' ? GALLERY_INITIAL_RENDER_COUNT : grid.querySelectorAll('.fs-card').length,
    totalItems
  );

  function isMarkerNearViewport() {
    if (!loadMarker) return false;
    const rect = loadMarker.getBoundingClientRect();
    const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
    return rect.top <= viewportHeight + 700;
  }

  function updateLoadStatus() {
    if (!loadStatus) return;
    if (renderedCount >= totalItems) {
      loadStatus.textContent = '';
      loadStatus.classList.add('is-done');
      return;
    }
    loadStatus.textContent = 'Menampilkan ' + renderedCount + ' dari ' + totalItems + ' foto...';
  }

  // Tombol like per foto (hanya galeri publik — PHP menandai item dengan like_enabled).
  // is-liked = saya yang like (merah); has-likes = ada like dari orang lain (kuning).
  function createLikeButton(it, index) {
    if (!likeCsrf || !it.like_enabled) return null;
    const count = parseInt(it.likes, 10) || 0;
    const liked = !!it.liked;
    const b = document.createElement('button');
    b.type = 'button';
    b.className = 'fs-like' + (liked ? ' is-liked' : (count > 0 ? ' has-likes' : ''));
    b.setAttribute('data-index', String(index));
    b.setAttribute('data-id', String(it.id));
    b.setAttribute('data-count', String(count));
    b.setAttribute('aria-pressed', liked ? 'true' : 'false');
    b.title = 'Like foto';
    b.setAttribute('aria-label', 'Like foto');
    b.innerHTML = '<svg viewBox="0 0 24 24" aria-hidden="true"><path d="M20.84 4.61a5.5 5.5 0 0 0-7.78 0L12 5.67l-1.06-1.06a5.5 5.5 0 0 0-7.78 7.78l1.06 1.06L12 21.23l7.78-7.78 1.06-1.06a5.5 5.5 0 0 0 0-7.78z"/></svg>' +
      '<span class="fs-like__count">' + count + '</span>';
    return b;
  }

  function createCard(it, index) {
    const wrap = document.createElement('div');
    wrap.className = 'fs-card-wrap';

    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = it.is_video ? 'fs-card has-video' : 'fs-card';
    btn.setAttribute('data-index', String(index));

    if (it.is_video) {
      const badge = document.createElement('span');
      badge.className = 'badge-vid';
      badge.textContent = 'Video';
      btn.appendChild(badge);

      const img = document.createElement('img');
      img.src = it.thumb;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.setAttribute('fetchpriority', 'low');
      btn.appendChild(img);

      const play = document.createElement('span');
      play.className = 'play';
      play.setAttribute('aria-hidden', 'true');
      btn.appendChild(play);
    } else {
      const img = document.createElement('img');
      img.src = it.thumb;
      img.alt = '';
      img.loading = 'lazy';
      img.decoding = 'async';
      img.setAttribute('fetchpriority', 'low');
      btn.appendChild(img);
    }

    wrap.appendChild(btn);

    const likeBtn = createLikeButton(it, index);
    if (likeBtn) wrap.appendChild(likeBtn);

    return wrap;
  }

  function renderNextBatch() {
    if (isRendering || renderedCount >= totalItems) {
      updateLoadStatus();
      if (renderedCount >= totalItems && observer) observer.disconnect();
      return;
    }
    isRendering = true;

    const end = Math.min(renderedCount + batchSize, totalItems);
    const fragment = document.createDocumentFragment();
    for (let i = renderedCount; i < end; i += 1) {
      fragment.appendChild(createCard(ITEMS[i], i));
    }
    grid.appendChild(fragment);
    renderedCount = end;
    isRendering = false;
    updateLoadStatus();

    // Desktop kadang berhenti di batch tertentu saat marker tetap dekat viewport
    // tetapi observer tidak menembak ulang. Lanjutkan render sampai marker benar-benar
    // keluar dari area prefetch atau item sudah habis.
    if (renderedCount < totalItems && isMarkerNearViewport()) {
      scheduleRender();
      return;
    }
    if (renderedCount >= totalItems && observer) observer.disconnect();
  }

  function scheduleRender() {
    const run = () => renderNextBatch();
    if (window.requestIdleCallback) {
      window.requestIdleCallback(run, { timeout: 300 });
      return;
    }
    window.setTimeout(run, 60);
  }

  updateLoadStatus();

  if (loadMarker && renderedCount < totalItems && 'IntersectionObserver' in window) {
    observer = new IntersectionObserver(entries => {
      entries.forEach(entry => {
        if (!entry.isIntersecting) return;
        scheduleRender();
        if (renderedCount >= totalItems) observer.disconnect();
      });
    }, { rootMargin: '700px 0px' });

    observer.observe(loadMarker);
  } else if (loadMarker && renderedCount < totalItems) {
    window.addEventListener('scroll', scheduleRender, { passive: true });
  }

  window.addEventListener('resize', () => {
    if (renderedCount < totalItems && isMarkerNearViewport()) {
      scheduleRender();
    }
  }, { passive: true });

  if (renderedCount < totalItems && isMarkerNearViewport()) {
    scheduleRender();
  }

  // === Simpan & pulihkan posisi galeri (kembali dari halaman foto) ===
  // Saat user membuka foto, simpan posisi scroll + jumlah item yang sudah
  // dirender ke sessionStorage. Saat kembali ke galeri, render ulang sampai
  // jumlah item yang sama lalu kembalikan scroll ke posisi semula.
  const STATE_KEY = (typeof GALLERY_EVENT_TOKEN === 'string' && GALLERY_EVENT_TOKEN)
    ? 'kp_gal_state_' + GALLERY_EVENT_TOKEN
    : null;

  function saveGalleryState() {
    if (!STATE_KEY) return;
    try {
      sessionStorage.setItem(STATE_KEY, JSON.stringify({
        scrollY: window.pageYOffset || document.documentElement.scrollTop || 0,
        renderedCount: renderedCount
      }));
    } catch (e) { /* abaikan: storage tidak tersedia */ }
  }

  function restoreGalleryState() {
    if (!STATE_KEY) return;
    let saved = null;
    try {
      const raw = sessionStorage.getItem(STATE_KEY);
      if (raw) saved = JSON.parse(raw);
      sessionStorage.removeItem(STATE_KEY);
    } catch (e) { return; }
    if (!saved || typeof saved.scrollY !== 'number' || saved.scrollY < 1) return;

    // Matikan scroll restoration bawaan browser supaya tidak melawan restore kita
    // (height galeri tumbuh bertahap karena lazy render + content-visibility).
    try { if ('scrollRestoration' in history) history.scrollRestoration = 'manual'; } catch (e) {}

    // Render ulang item sampai jumlah yang sama seperti sebelum buka foto.
    const targetCount = Math.min(
      Math.max(Math.floor(saved.renderedCount) || 0, renderedCount),
      totalItems
    );
    while (renderedCount < targetCount && renderedCount < totalItems) {
      renderNextBatch();
    }
    updateLoadStatus();

    // scrollTo diulang tiap frame + saat load/resize sampai posisi stabil.
    const targetY = saved.scrollY;
    let tries = 0;
    (function applyScroll() {
      window.scrollTo(0, targetY);
      tries += 1;
      if (tries < 30) window.requestAnimationFrame(applyScroll);
    })();
    window.addEventListener('load', function onLoad() { window.scrollTo(0, targetY); });
    window.addEventListener('resize', function onResize() { window.scrollTo(0, targetY); }, { passive: true });
  }

  // Jika halaman dipulihkan dari bfcache, posisi scroll sudah otomatis benar —
  // buang state tersimpan supaya tidak dipakai pada kunjungan berikutnya.
  window.addEventListener('pageshow', function (e) {
    if (e.persisted && STATE_KEY) {
      try { sessionStorage.removeItem(STATE_KEY); } catch (err) {}
    }
  });

  restoreGalleryState();

  // === Toggle like (galeri publik) via /api/photo-like.php ===
  function toggleLike(btn) {
    if (btn.disabled) return;
    btn.disabled = true;

    const wasLiked = btn.classList.contains('is-liked');
    const countEl = btn.querySelector('.fs-like__count');
    const base = parseInt(btn.getAttribute('data-count'), 10) || 0;

    // Optimistic UI: ubah langsung, rollback bila server menolak.
    const next = Math.max(0, base + (wasLiked ? -1 : 1));
    btn.classList.toggle('is-liked', !wasLiked);
    btn.classList.toggle('has-likes', wasLiked && next > 0);
    btn.setAttribute('aria-pressed', String(!wasLiked));
    if (countEl) countEl.textContent = next;

    function rollback() {
      btn.classList.toggle('is-liked', wasLiked);
      btn.classList.toggle('has-likes', !wasLiked && base > 0);
      btn.setAttribute('aria-pressed', String(wasLiked));
      if (countEl) countEl.textContent = base;
    }

    fetch('/api/photo-like.php', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({
        e: typeof GALLERY_EVENT_TOKEN === 'string' ? GALLERY_EVENT_TOKEN : '',
        id: btn.getAttribute('data-id'),
        csrf: likeCsrf
      })
    })
      .then(res => res.json().catch(() => ({})))
      .then(data => {
        if (data && data.ok) {
          const liked = !!data.liked;
          const count = parseInt(data.count, 10) || 0;
          btn.setAttribute('data-count', String(count));
          btn.classList.toggle('is-liked', liked);
          btn.classList.toggle('has-likes', !liked && count > 0);
          btn.setAttribute('aria-pressed', String(liked));
          if (countEl) countEl.textContent = count;
        } else {
          rollback();
        }
      })
      .catch(rollback)
      .finally(() => { btn.disabled = false; });
  }

  if (likeCsrf) {
    grid.addEventListener('click', e => {
      const likeBtn = e.target.closest('.fs-like');
      if (!likeBtn) return;
      // Jangan sampai klik like ikut membuka halaman foto.
      e.preventDefault();
      e.stopPropagation();
      toggleLike(likeBtn);
    });
  }

  // === Klik foto di grid -> navigasi ke single-photo page ===
  grid.addEventListener('click', e => {
    const card = e.target.closest('.fs-card');
    if (!card) return;
    const i = parseInt(card.getAttribute('data-index'), 10);
    if (isNaN(i)) return;
    const it = ITEMS[i];
    if (!it) return;
    // Simpan posisi sebelum pindah ke halaman foto supaya bisa dipulihkan saat kembali.
    saveGalleryState();
    // Prioritaskan share_token (URL clean /i/{token}); fallback ke /dl/{id}
    if (it.share_token) {
      window.location.href = '/i/' + encodeURIComponent(it.share_token);
    } else if (it.id) {
      // Backward compat: kalau photo lama belum punya share_token,
      // buka halaman single-photo pakai id (photo.php fallback numeric)
      window.location.href = '/i/' + encodeURIComponent(String(it.id));
    }
  });

})();
