const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const outputDirectory = 'dist';
const inputDirectory = 'src/client';

module.exports = {
  entry: {
    'file-upload': path.join(__dirname, inputDirectory, 'FileUploader.js'),
    'file-upload.min': path.join(__dirname, inputDirectory, 'FileUploader.js'),
    'index': path.join(__dirname, inputDirectory, 'index.js'),
  },
  output: {
    path: path.join(__dirname, outputDirectory),
    filename: '[name].js',
    library: 'FileUploader',
    libraryTarget: 'umd',
    libraryExport: 'default'
  },
  module: {
    rules: [
      {
        test: /\.js$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader'
        }
      }
    ]
  },
  devServer: {
    port: 3000,
    open: true,
    proxy: {
      '/file': 'http://localhost:8080'
    }
  },
  optimization: {
    minimize: true,
    minimizer: [new UglifyJsPlugin({
      include: /\.min\.js$/
    })]
  },
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.js'
    }
  },
  plugins: [
    new CleanWebpackPlugin([outputDirectory]),
    new HtmlWebpackPlugin({
      template: './src/client/index.html',
      chunks: ['index']
    })
  ]
};
