const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/server/main.ts', // Ensure this points to your server entry point
  target: 'node',
  output: {
    filename: 'main.ts',
    path: path.resolve(__dirname, 'dist'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
    alias: {
      backend: path.resolve(__dirname, 'src'),
    },
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        exclude: /node_modules/,
        use: 'ts-loader',
      },
    ],
  },
};
