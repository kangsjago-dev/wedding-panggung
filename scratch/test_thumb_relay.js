const handler = require('../api/kingphotobooth.js').default;

async function test() {
  console.log("=== Testing action=thumb relay ===");
  let thumbStatusCode = 200;
  let thumbContentType = "";
  let thumbBufferLength = 0;

  const reqThumb = {
    query: {
      action: "thumb",
      token: "8e381a55",
      origin: "https://x1.kingphotobooth.co"
    },
    headers: {}
  };
  const resThumb = {
    setHeader: (k, v) => {
      if (k.toLowerCase() === 'content-type') thumbContentType = v;
    },
    status: (code) => {
      thumbStatusCode = code;
      return {
        send: (buf) => {
          thumbBufferLength = buf.length;
        }
      };
    },
    send: (buf) => {
      thumbBufferLength = buf.length;
    }
  };

  await handler(reqThumb, resThumb);
  console.log("Thumb Relay Result:", {
    status: thumbStatusCode,
    contentType: thumbContentType,
    bytes: thumbBufferLength
  });
}

test().catch(console.error);

