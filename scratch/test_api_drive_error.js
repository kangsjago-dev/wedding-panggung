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
    console.log("JSON response:", data);
  }
};

handler.default(req, res);

