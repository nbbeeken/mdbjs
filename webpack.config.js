// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");

const config = {
  entry: "./src/index.ts",
  devtool: 'cheap-module-source-map',
  optimization: {
    minimize: false
  },
  output: {
    path: path.resolve(__dirname, 'dist'),
    filename: 'mongodb.cjs',
    globalObject: 'globalThis',
    library: {
      name: 'mongodb',
      type: 'umd',
    },
  },
  plugins: [
  ],
  module: {
    rules: [
      {
        test: /\.(ts|tsx)$/i,
        loader: "ts-loader",
        exclude: ["/node_modules/"],
      },
    ],
  },
  resolve: {
    extensions: [".tsx", ".ts", ".jsx", ".js", "..."],
    alias: {
      buffer: require.resolve('buffer'),
      stream: require.resolve('readable-stream'),
      timers: require.resolve('timers-browserify'),
      url: require.resolve('whatwg-url'),
      util: require.resolve('util/'),
      crypto: path.resolve(__dirname, 'src/modules/crypto.ts'),
      net: path.resolve(__dirname, 'src/modules/net.ts'),
      os: path.resolve(__dirname, 'src/modules/os.ts'),
      process: path.resolve(__dirname, 'src/modules/process.ts'),
    },
    fallback: {
      kerberos: false,
      '@mongodb-js/zstd': false,
      '@aws-sdk/credential-providers': false,
      snappy: false,
      'mongodb-client-encryption': false,
      socks: false,
      aws4: false,
      dns: false,
      http: false,
      tls: false,
      saslprep: false,
      'fs/promises': false,
      zlib: false,
      fs: false,
      path: false,
    },
  },
};

module.exports = () => {
  return config;
};
