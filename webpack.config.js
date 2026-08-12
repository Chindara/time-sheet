const path = require('path');
const webpack = require('webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const CopyWebpackPlugin = require('copy-webpack-plugin');

// Stamped into the bundle and logged at startup, so "is the deployed build the
// one I just fixed?" is answerable from the console instead of by guesswork.
const { version } = require('./vss-extension.json');

module.exports = {
  entry: {
    'timesheet-tab': './src/TimeSheetTab.tsx',
    'project-timesheet': './src/project-timesheet.tsx'
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
    new webpack.DefinePlugin({
      __EXTENSION_VERSION__: JSON.stringify(version)
    }),
    new HtmlWebpackPlugin({
      template: './src/timesheet-tab.html',
      filename: 'timesheet-tab.html',
      chunks: ['timesheet-tab']
    }),
    new HtmlWebpackPlugin({
      template: './src/project-timesheet.html',
      filename: 'project-timesheet.html',
      chunks: ['project-timesheet']
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
