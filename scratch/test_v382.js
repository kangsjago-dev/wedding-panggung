const assert = require('assert');

console.log("=== TEST 1: Antrean Unduh Foto (Multi-Item Queue Test) ===");

const downloadQueue = {
  items: [],
  currentPhoto: null,
  isProcessing: false,
  completedPhotos: []
};

function fakeQueuePhotoDownload(photo) {
  const isAlreadyQueued = downloadQueue.items.some(it => it.id === photo.id);
  const isCurrent = downloadQueue.currentPhoto && downloadQueue.currentPhoto.id === photo.id;
  if (isAlreadyQueued || isCurrent) return false;

  downloadQueue.items.push(photo);
  if (!downloadQueue.isProcessing) {
    fakeProcessNextQueue();
  }
  return true;
}

function fakeProcessNextQueue() {
  if (downloadQueue.items.length === 0) {
    downloadQueue.isProcessing = false;
    downloadQueue.currentPhoto = null;
    return;
  }
  downloadQueue.isProcessing = true;
  const photo = downloadQueue.items.shift();
  downloadQueue.currentPhoto = photo;

  // Simulate download execution
  setTimeout(() => {
    downloadQueue.completedPhotos.push(photo.id);
    fakeProcessNextQueue();
  }, 10);
}

// Queue 5 photos in quick succession (simulating user swiping and tapping download)
for (let i = 1; i <= 5; i++) {
  fakeQueuePhotoDownload({ id: 'photo_' + i, name: 'Foto ' + i });
}

setTimeout(() => {
  console.log("Completed downloads:", downloadQueue.completedPhotos);
  assert.strictEqual(downloadQueue.completedPhotos.length, 5);
  assert.strictEqual(downloadQueue.completedPhotos.join(','), 'photo_1,photo_2,photo_3,photo_4,photo_5');
  console.log("✓ TEST 1 PASSED: Seluruh 5 foto dalam antrean berhasil diunduh 100% tanpa ada yang terlewat!");

  console.log("\n=== TEST 2: Anti-Ghosting Text Mutation Guard ===");
  const mockDOM = {
    coupleName: { textContent: 'Wilson & Felicia' },
    eventVenue: { textContent: 'UpperHills Convention Hall, Makassar' }
  };

  let reflowCount = 0;
  function setNodeTextIfChanged(el, newText) {
    if (!el || newText === undefined || newText === null) return;
    const str = String(newText);
    if (el.textContent !== str) {
      el.textContent = str;
      reflowCount++;
    }
  }

  // Set with same values
  setNodeTextIfChanged(mockDOM.coupleName, 'Wilson & Felicia');
  setNodeTextIfChanged(mockDOM.eventVenue, 'UpperHills Convention Hall, Makassar');
  assert.strictEqual(reflowCount, 0, "No reflow should happen when values are identical");
  console.log("✓ Reflow count with identical text: 0 (Bebas ghosting / flicker)");

  // Set with changed values
  setNodeTextIfChanged(mockDOM.coupleName, 'Wilson & Felicia New');
  assert.strictEqual(reflowCount, 1, "Reflow only occurs when text genuinely changes");
  assert.strictEqual(mockDOM.coupleName.textContent, 'Wilson & Felicia New');
  console.log("✓ TEST 2 PASSED: Mutasi DOM diproteksi ketat dan bebas efek ghosting!");

  console.log("\n=== TEST 3: Smart Grid Diffing (Anti-Flicker) ===");
  const gridCards = [
    { getAttribute: () => 'p1' },
    { getAttribute: () => 'p2' },
    { getAttribute: () => 'p3' }
  ];
  const newPhotos = [
    { id: 'p1' },
    { id: 'p2' },
    { id: 'p3' }
  ];

  let domCleared = false;
  function renderPhotoGridTest(cards, photos) {
    if (cards.length === photos.length && photos.length > 0) {
      let isSame = true;
      for (let i = 0; i < cards.length; i++) {
        if (cards[i].getAttribute('data-photo-id') !== String(photos[i].id)) {
          isSame = false;
          break;
        }
      }
      if (isSame) return "SKIPPED_RELOAD";
    }
    domCleared = true;
    return "RELOADED";
  }

  const resultSame = renderPhotoGridTest(gridCards, newPhotos);
  assert.strictEqual(resultSame, "SKIPPED_RELOAD");
  assert.strictEqual(domCleared, false);
  console.log("✓ Grid diffing result for same photos:", resultSame, "(Grid TIDAK dihapus/berkedip!)");

  const resultDiff = renderPhotoGridTest(gridCards, [{ id: 'p1' }, { id: 'p4' }]);
  assert.strictEqual(resultDiff, "RELOADED");
  assert.strictEqual(domCleared, true);
  console.log("✓ Grid diffing result for changed photos:", resultDiff);
  console.log("✓ TEST 3 PASSED: Grid foto stabil dan tidak pernah berkedip saat foto tidak berubah!");

  console.log("\n=== ALL TESTS PASSED SUCCESSFULLY! ===");
}, 100);

