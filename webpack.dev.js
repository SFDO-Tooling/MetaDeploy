/* eslint-disable no-process-env */

'use strict';

process.env.NODE_ENV = 'development';

const CleanWebpackPlugin = require('clean-webpack-plugin');
const I18nextWebpackPlugin = require('i18next-scanner-webpack');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const common = require('./webpack.common.js');
const merge = require('webpack-merge');
const path = require('path');

module.exports = merge(common, {
  mode: 'development',
  output: {
    filename: '[name].js',
    path: path.join(__dirname, 'dist'),
  },
  devtool: 'cheap-module-inline-source-map',
  devServer: {
    index: '',
    proxy: {
      '**': 'http://localhost:8000',
      '/ws': {
        target: 'http://localhost:8000',
        ws: true,
      },
    },
    hot: false,
    writeToDisk: true,
  },
  plugins: [
    new CleanWebpackPlugin(['dist/*.*']),
    new MiniCssExtractPlugin({
      filename: '[name].css',
    }),
    new I18nextWebpackPlugin({
      src: ['./src/js/'],
      options: {
        func: {
          list: ['t', '$t', 'i18next.t', 'i18n.t'],
        },
        lngs: ['en'],
        resource: {
          loadPath: '{{lng}}/{{ns}}.json',
          savePath: '{{lng}}/{{ns}}.json',
        },
        defaultValue(lng, ns, key) {
          if (lng === 'en') {
            // Return key as the default value for English language
            return key;
          }
          // Return the string '__NOT_TRANSLATED__' for other languages
          return '__NOT_TRANSLATED__';
        },
      },
    }),
  ],
});
