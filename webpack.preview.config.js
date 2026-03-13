const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');

module.exports = {
  mode: 'development',
  entry: './src/preview.tsx',
  output: {
    filename: 'preview.js',
    path: path.resolve(__dirname, 'preview-dist'),
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx']
  },
  module: {
    rules: [
      {
        test: /\.tsx?$/,
        use: 'ts-loader',
        exclude: /node_modules/
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader']
      },
      {
        test: /\.(woff|woff2|eot|ttf|otf)$/,
        type: 'asset/resource'
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: 'src/preview.html',
      inject: true
    })
  ],
  devServer: {
    static: {
      directory: path.join(__dirname, 'preview-dist')
    },
    compress: true,
    port: 3000,
    hot: true,
    open: true
  },
  devtool: 'source-map'
};
