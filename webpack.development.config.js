const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

const exampleDirectory = 'example/client';
const outputDirectory = path.join(__dirname, 'dist');

module.exports = {
  mode: 'development',
  devtool: 'cheap-module-eval-source-map',
  entry: {
    index: path.resolve(__dirname, exampleDirectory, 'index.js'),
  },
  output: {
    path: outputDirectory,
    filename: '[name].js',
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
  resolve: {
    alias: {
      'vue': 'vue/dist/vue.js'
    }
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: path.resolve(__dirname, exampleDirectory, 'index.html')
    })
  ]
};
