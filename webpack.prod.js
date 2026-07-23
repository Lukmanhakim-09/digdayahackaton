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
      clientsClaim: true,
      skipWaiting: true,
      maximumFileSizeToCacheInBytes: 25 * 1024 * 1024,
      runtimeCaching: [
        // Cache Google Fonts stylesheets
        {
          urlPattern: /^https:\/\/fonts\.googleapis\.com/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'google-fonts-stylesheets',
          },
        },
        // Cache Google Fonts webfonts
        {
          urlPattern: /^https:\/\/fonts\.gstatic\.com/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'google-fonts-webfonts',
            expiration: {
              maxEntries: 30,
              maxAgeSeconds: 60 * 60 * 24 * 365, // 1 tahun
            },
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Cache Unpkg CDN (Lucide icons, etc.)
        {
          urlPattern: /^https:\/\/unpkg\.com/i,
          handler: 'StaleWhileRevalidate',
          options: {
            cacheName: 'unpkg-cdn-cache',
            cacheableResponse: {
              statuses: [0, 200],
            },
          },
        },
        // Cache HuggingFace model files (transformers.js) — CacheFirst
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
        // Cache WASM, MJS, dan font files
        {
          urlPattern: /\.(wasm|mjs|woff|woff2|ttf|eot)$/i,
          handler: 'CacheFirst',
          options: {
            cacheName: 'wasm-fonts-cache',
            expiration: {
              maxEntries: 20,
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
      ],
    }),
  ],
});
