const handler = require('../api/drive-folder.js');

const req = {
  query: {
    folderId: "1qCHAv1hTfsnUQ5g6iHFCVkM3x60vw4uh",
    category: "Semua Foto"
  }
};

const res = {
  status: function(code) {
    this.statusCode = code;
    return this;
  },
  json: function(data) {
    console.log("Status:", this.statusCode || 200);
    console.log("Success:", data.success);
    console.log("Photos count:", (data.photos || []).length);
    console.log("Message:", data.message);
  }
};

handler.default(req, res).catch(err => console.error("Handler error:", err));

