const { createProxyMiddleware } = require("http-proxy-middleware");
module.exports = function (app) {
  app.use(
    createProxyMiddleware("/skolenhetsregistret", {
      target: "https://api.skolverket.se/",
      changeOrigin: true,
    })
  );
};