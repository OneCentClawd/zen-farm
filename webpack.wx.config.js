const path = require('path');

module.exports = {
  mode: 'production',
  entry: './src/index-wx.ts',
  output: {
    filename: 'game.js',
    path: path.resolve(__dirname, 'minigame'),
  },
  resolve: {
    extensions: ['.ts', '.js'],
  },
  module: {
    rules: [
      {
        test: /\.ts$/,
        use: 'ts-loader',
        exclude: /node_modules/,
      },
    ],
  },
  // 微信小游戏环境
  target: 'web',
  optimization: {
    minimize: true,
  },
};
