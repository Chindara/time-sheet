const path = require('path');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

module.exports = {
  entry: {
    'timesheet-tab': './src/TimeSheetTab.tsx'
  },
  output: {
    filename: '[name].js',
    path: path.resolve(__dirname, 'dist'),
    clean: true
  },
  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx'],
    alias: {
      '@': path.resolve(__dirname, 'src')
    }
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
        use: [
          'style-loader',
          'css-loader',
          'postcss-loader'
        ]
      }
    ]
  },
  plugins: [
    new HtmlWebpackPlugin({
      template: './src/timesheet-tab.html',
      filename: 'timesheet-tab.html',
      chunks: ['timesheet-tab']
    }),
    new CopyWebpackPlugin({
      patterns: [
        { from: 'vss-extension.json', to: 'vss-extension.json' },
        { from: 'images', to: 'images', noErrorOnMissing: true }
      ]
    })
  ],
  devtool: 'source-map',
  mode: 'development'
};
