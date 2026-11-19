const handler = require('../api/download-proxy.js').default;

const req = {
  method: 'GET',
  query: {
    url: 'https://lh3.googleusercontent.com/d/1vONpAejtUhbGlXsDmNtxCQbZr30UtHtn=w2048',
    filename: 'test_sample.jpg'
  }
};

const headers = {};
const res = {
  setHeader(k, v) { headers[k] = v; },
  status(code) {
    this.statusCode = code;
    return this;
  },
  send(buf) {
    console.log("Status:", this.statusCode || 200);
    console.log("Headers:", headers);
    console.log("Buffer Length:", buf.length);
  },
  json(obj) {
    console.log("JSON:", obj);
  }
};

handler(req, res).catch(console.error);

