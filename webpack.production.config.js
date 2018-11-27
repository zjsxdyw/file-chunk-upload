const path = require('path');
const CleanWebpackPlugin = require('clean-webpack-plugin');
const UglifyJsPlugin = require('uglifyjs-webpack-plugin');

const outputDirectory = path.join(__dirname, 'dist');

module.exports = {
  mode: 'production',
  entry: {
    'file-chunk-upload': './src/FileUploader.js',
    'file-chunk-upload.min': './src/FileUploader.js'
  },
  output: {
    path: outputDirectory,
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
  optimization: {
    minimize: true,
    minimizer: [new UglifyJsPlugin({
      include: /\.min\.js$/
    })]
  },
  plugins: [
    new CleanWebpackPlugin([outputDirectory])
  ]
};
