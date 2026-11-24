const handler = require('../api/kingphotobooth.js').default;

async function test() {
  console.log("=== 1. Test List Parsing ===");
  const reqList = {
    query: {
      url: "https://x1.kingphotobooth.co/e/2e0df2c7a2cd95b331b00d40",
      category: "Photobooth"
    },
    headers: {}
  };
  let listData = null;
  const resList = {
    setHeader: (k, v) => {},
    status: (code) => {
      console.log("List HTTP status:", code);
      return {
        json: (data) => {
          listData = data;
        }
      };
    }
  };

  await handler(reqList, resList);
  console.log("Photos parsed:", listData ? listData.count : 0);
  if (listData && listData.photos && listData.photos.length > 0) {
    const videoItem = listData.photos.find(p => p.isVideo);
    const photoItem = listData.photos.find(p => !p.isVideo);
    console.log("Found video item:", videoItem ? videoItem.name : "none", "videoUrl:", videoItem ? videoItem.videoUrl : "");
    console.log("Found photo item:", photoItem ? photoItem.name : "none", "previewUrl:", photoItem ? photoItem.previewUrl : "");

    if (videoItem && videoItem.shareToken) {
      console.log("\n=== 2. Test Media Streaming for Video (shareToken: " + videoItem.shareToken + ") ===");
      let mediaStatusCode = 200;
      let mediaContentType = "";
      let mediaBufferLength = 0;
      const reqMedia = {
        query: {
          action: "media",
          token: videoItem.shareToken,
          origin: "https://x1.kingphotobooth.co"
        },
        headers: {}
      };
      const resMedia = {
        setHeader: (k, v) => {
          if (k.toLowerCase() === 'content-type') mediaContentType = v;
        },
        status: (code) => {
          mediaStatusCode = code;
          return {
            send: (buf) => {
              mediaBufferLength = buf.length;
            }
          };
        },
        send: (buf) => {
          mediaBufferLength = buf.length;
        }
      };

      await handler(reqMedia, resMedia);
      console.log("Stream status:", mediaStatusCode, "Content-Type:", mediaContentType, "Bytes transferred:", mediaBufferLength);
    }
  }
}

test().catch(console.error);

