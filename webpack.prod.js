const { merge } = require('webpack-merge');
const common = require('./webpack.common.js');
const { CleanWebpackPlugin } = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const WorkboxWebpackPlugin = require('workbox-webpack-plugin');

module.exports = merge(common, {
  mode: 'production',
  devtool: false,
  module: {
    rules: [
      {
        test: /\.css$/i,
        use: [MiniCssExtractPlugin.loader, 'css-loader'],
      },
    ],
  },
  plugins: [
    new CleanWebpackPlugin(),
    new MiniCssExtractPlugin({
      filename: '[name].[contenthash].css',
    }),
    new WorkboxWebpackPlugin.GenerateSW({
      swDest: 'sw.js',
      maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
      runtimeCaching: [
        // Cache HuggingFace model files (transformers.js) — CacheFirst karena tidak berubah
        {
          urlPattern: /^https:\/\/huggingface\.co\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'huggingface-model-cache',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 30, // 30 hari
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Cache CDN HuggingFace
        {
          urlPattern: /^https:\/\/cdn-lfs.*\.huggingface\.co\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'huggingface-cdn-cache',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 30,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Cache file WASM dan MJS lokal yang besar — CacheFirst karena hash-based
        {
          urlPattern: /\.(wasm|mjs)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'wasm-mjs-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 30,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Cache model lokal (metadata.json, model.json, weights.bin) — CacheFirst
        {
          urlPattern: /\/model\/.*/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'local-model-cache',
            expiration: {
              maxEntries: 10,
              maxAgeSeconds: 60 * 60 * 24 * 30,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Cache aset statis (CSS, JS bundle, icons) — StaleWhileRevalidate
        {
          urlPattern: /\.(css|js|png|ico|json)$/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'static-assets-cache',
            expiration: {
              maxEntries: 60,
              maxAgeSeconds: 60 * 60 * 24 * 7, // 7 hari
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Cache API calls — NetworkFirst agar data terbaru diprioritaskan
        {
          urlPattern: /^https:\/\/api\./i,
          handler: 'NetworkFirst',
          options: {
            cacheName: 'api-cache',
            expiration: {
              maxEntries: 50,
              maxAgeSeconds: 60 * 60 * 24,
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
      ],
    }),
  ],
});
