const { sentryWebpackPlugin } = require('@sentry/webpack-plugin');
const { tanstackRouter } = require('@tanstack/router-plugin/webpack');
const HtmlWebpackPlugin = require('html-webpack-plugin');
const webpack = require('webpack');
require('dotenv').config();

const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/ui/index.tsx',

  output: {
    filename: 'bundle.js',
    path: path.resolve(__dirname, 'dist/client'),
  },

  resolve: {
    extensions: ['.ts', '.tsx', '.js', '.jsx', '.css', '.module.scss'],
    alias: {
      ui: path.resolve(__dirname, 'src/ui'),
      shared: path.resolve(__dirname, 'src/shared'),
    },
  },

  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/,
        exclude: /node_modules/,
        use: 'babel-loader',
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader'],
      },
      {
        test: /\.module\.scss$/,
        use: [
          'style-loader',
          {
            loader: 'css-loader',
            options: {
              importLoaders: 1,
              sourceMap: true,
              esModule: false,
              modules: {
                auto: /\.module\.[a-z]+$/,
                localIdentName: '[name]__[local]___[hash:base64:5]',
              },
            },
          },
          {
            loader: 'sass-loader',
            options: {
              implementation: require('sass'),
              sourceMap: true,
            },
          },
        ],
      },
    ],
  },

  devServer: {
    static: {
      directory: path.join(__dirname, 'public'),
      publicPath: '/',
    },
    port: 8081,
    open: {
      app: {
        name: 'chrome',
      },
    },
    historyApiFallback: {
      rewrites: [{ from: /./, to: '/index.html' }],
    },
    proxy: [
      {
        context: ['/api'],
        secure: false,
        target: 'http://localhost:3000',
      },
    ],
  },

  devtool: 'source-map',

  plugins: [
    new webpack.DefinePlugin({
      'process.env.NODE_ENV': JSON.stringify(
        process.env.NODE_ENV || 'development',
      ),
      'process.env.SENTRY_DSN': JSON.stringify(process.env.SENTRY_DSN || ''),
    }),
    // Only include Sentry plugin in production builds with auth token
    ...(process.env.NODE_ENV === 'production' && process.env.SENTRY_AUTH_TOKEN
      ? [
          sentryWebpackPlugin({
            authToken: process.env.SENTRY_AUTH_TOKEN,
            org: 'freeland-f7',
            project: 'developerprofile',
          }),
        ]
      : []),
    tanstackRouter({
      target: 'react',
      autoCodeSplitting: true,
      routesDirectory: './src/ui/shared/routes',
      generatedRouteTree: './src/ui/routeTree.gen.ts',
      semicolons: true,
    }),
    new HtmlWebpackPlugin({
      template: './public/index.html',
    }),
  ],
};
