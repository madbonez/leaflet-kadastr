const express = require('express');
const { createProxyMiddleware } = require('http-proxy-middleware');

const app = express();

app.use('/', createProxyMiddleware({ target: 'https://pkk.rosreestr.ru', changeOrigin: true }));
app.listen(4040);
