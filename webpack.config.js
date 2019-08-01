const path = require('path');
const HtmlWebPackPlugin = require("html-webpack-plugin");

const serverConfig = {
  entry: './src/index.js',
  target: 'node',
  mode: 'development',
  output: {
    filename: 'server.js',
    path: path.resolve(__dirname, 'dist')
  },
  module: {
    rules: [{
      test: /\.js$/,
      exclude: /node_modules/,
      use: {
        loader: 'babel-loader',
      }
    }]
  },
  node: {
  __dirname: false,
   fs: "empty",
   child_process : "empty",
   dns: "empty",
   module: "empty",
   net: "empty",
   tls: "empty"
 }
};

const clientConfig = {
  entry: './client/src/index.js',
  mode:'development',
  module: {
		rules: [
    {
        test: /\.(js|jsx)$/,
        exclude: /(node_modules|bower_components)/,
        loader: "babel-loader",
        options: { presets: ["@babel/env"] }
    },
    {
            test: /\.(png|jp(e*)g|svg)$/,  
            use: [{
                loader: 'url-loader',
            }]
        }
   ]
  },
   plugins: [
    new HtmlWebPackPlugin({
      template: "./client/index.html",
      filename: "./index.html"
    })
  ],
  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/app')
  },
  resolve: {
    extensions: ['*', '.js', '.jsx']
  }
};

module.exports = [ serverConfig, clientConfig ]