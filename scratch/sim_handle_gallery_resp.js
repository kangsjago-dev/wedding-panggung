// Simulate handleGalleryResponse with photos: []

const state = {
  currentEventId: "tommy-natasha-594",
  allPhotosLabel: "Photostage",
  activeCategory: "Photostage",
  allPhotos: [],
  filteredPhotos: [],
  activeConfig: {
    DRIVE_FOLDER_ID: "https://drive.google.com/drive/folders/1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
    ALL_PHOTOS_LABEL: "Photostage",
    customCategories: [
      {
        id: "special_photobooth",
        isPhotobooth: true,
        name: "Photobooth",
        url: "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR",
        enabled: true
      }
    ]
  }
};

const response = {
  success: true,
  isDemo: false,
  activeEventId: "tommy-natasha-594",
  config: state.activeConfig,
  photos: [],
  categories: ["Photostage"]
};

console.log("Simulating handleGalleryResponse...");

const activeDriveId = "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh";
const respDriveId = "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh";

console.log("activeDriveId === respDriveId:", activeDriveId === respDriveId);

const incomingPhotos = (response.photos || []);
const sortedIncoming = incomingPhotos;

console.log("sortedIncoming.length:", sortedIncoming.length);

if (sortedIncoming.length === 0) {
  state.allPhotos = [];
  state.filteredPhotos = [];
  const mainCat = state.allPhotosLabel || "Semua Foto";
  console.log("Calling renderCategoryTabs()...");
  console.log("Calling applyCategoryFilter(state.activeCategory || mainCat)...");
  console.log("activeCategory to pass:", state.activeCategory || mainCat);
}

