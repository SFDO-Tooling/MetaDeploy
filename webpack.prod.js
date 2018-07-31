/* eslint-disable no-process-env */

'use strict';

process.env.NODE_ENV = 'production';

const CleanWebpackPlugin = require('clean-webpack-plugin');
const MiniCssExtractPlugin = require('mini-css-extract-plugin');
const common = require('./webpack.common.js');
const merge = require('webpack-merge');
const path = require('path');
const webpack = require('webpack');

module.exports = merge(common, {
  mode: 'production',
  output: {
    filename: '[name].[chunkhash].min.js',
    path: path.join(__dirname, 'dist', 'prod'),
  },
  devtool: 'source-map',
  plugins: [
    new CleanWebpackPlugin(['dist/prod/*.*']),
    new MiniCssExtractPlugin({
      filename: '[name].[chunkhash].min.css',
    }),
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify('production'),
    }),
    new webpack.HashedModuleIdsPlugin(),
  ],
});
