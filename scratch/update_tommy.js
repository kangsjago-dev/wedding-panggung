const gasUrl = "https://script.google.com/macros/s/AKfycbzGgpibRzZboG9vNrTyxzko5mGkW6LfabNYfBxm2v6c-gO9O_iKLqMocxCZ5GVdiM1l/exec";

const tommyEvent = {
  id: "tommy-natasha-594",
  name: "Tommy & Natasha",
  date: "Rabu, 25 November 2026",
  venue: "UpperHills Convention Hall, Makassar",
  homeUrl: "https://gallery.runway.my.id/?event=tommy-natasha-594",
  driveFolderId: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
  photoboothUrl: "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR",
  customCategories: [{ id: "special_photobooth", name: "Photobooth", url: "https://photos.google.com/share/AF1QipMagPm7xWB2YANajDr3hx-J4WKyhOgIQ41jUjqQnxv5LSy6392pyWC5hOfsQoz1mA?key=c1BLMDNyRGw4bEJyUWo5b1Y0eFlmTy14X1pESEdR", enabled: true, isPhotobooth: true }],
  frameImageUrl: "",
  logoUrl: "",
  status: "Aktif"
};

async function run() {
  console.log("Calling addEvent for tommy-natasha-594...");
  const res = await fetch(gasUrl, {
    method: "POST",
    headers: { "Content-Type": "text/plain;charset=utf-8" },
    body: JSON.stringify({
      action: "addEvent",
      pin: "111111",
      event: tommyEvent
    })
  });
  const text = await res.text();
  console.log("addEvent result:", text);
}

run();

