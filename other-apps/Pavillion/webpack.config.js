const path = require('path');

module.exports = {
  mode: 'development',
  entry: './src/react/index.jsx',
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'react-bundle.js',
    library: 'PavillionReact',
    libraryTarget: 'umd'
  },
  module: {
    rules: [
      {
        test: /\.(js|jsx)$/,
        exclude: /node_modules/,
        use: {
          loader: 'babel-loader',
          options: {
            presets: ['@babel/preset-react']
          }
        }
      },
      {
        test: /\.css$/,
        use: ['style-loader', 'css-loader', 'postcss-loader']
      }
    ]
  },
  resolve: {
    extensions: ['.js', '.jsx']
  },
  target: 'electron-renderer'
};