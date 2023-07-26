// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");

// const isProduction = process.env.NODE_ENV == "production";
const isProduction = false;

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
      // url: path.resolve(__dirname, 'src/modules/url.ts'),
      url: require.resolve('whatwg-url'),
      net: path.resolve(__dirname, 'src/modules/net.ts'),
      // timers: path.resolve(__dirname, 'src/modules/timers.ts'),
      timers: require.resolve('timers-browserify'),
      stream: path.resolve(__dirname, 'src/modules/stream.ts'),
      // stream: require.resolve('stream-browserify'),
      // buffer: path.resolve(__dirname, 'src/modules/buffer.ts'),
      buffer: require.resolve('buffer'),
      // util: path.resolve(__dirname, 'src/modules/util.ts'),
      util: require.resolve('util/'),
      os: path.resolve(__dirname, 'src/modules/os.ts'),
      // os: require.resolve('os-browserify'),
      process: path.resolve(__dirname, 'src/modules/process.ts'),
      // process: require.resolve('process'),
      crypto: path.resolve(__dirname, 'src/modules/crypto.ts'),
      // crypto: require.resolve('crypto-browserify'),
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
  if (isProduction) {
    config.mode = "production";
  } else {
    config.mode = "development";
  }
  return config;
};
