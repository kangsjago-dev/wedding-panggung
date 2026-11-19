const testUrl = "https://drive.usercontent.google.com/download?id=1v1JVB7O37gs01LTuEmVumlOjgVu53gat&export=download";

async function testFetch() {
  const res = await fetch(testUrl, {
    redirect: "follow",
    headers: {
      "User-Agent": "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36",
      "Accept": "*/*"
    }
  });
  console.log("Status:", res.status);
  console.log("Content-Type:", res.headers.get("content-type"));
  console.log("Content-Length:", res.headers.get("content-length"));
  console.log("Content-Disposition:", res.headers.get("content-disposition"));
  const buf = await res.arrayBuffer();
  console.log("Length:", buf.byteLength);
}

testFetch();

