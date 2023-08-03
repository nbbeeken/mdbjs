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
      url: require.resolve('whatwg-url'),
      net: path.resolve(__dirname, 'src/modules/net.ts'),
      timers: require.resolve('timers-browserify'),
      stream: require.resolve('readable-stream'),
      buffer: require.resolve('buffer'),
      util: require.resolve('util/'),
      os: path.resolve(__dirname, 'src/modules/os.ts'),
      process: path.resolve(__dirname, 'src/modules/process.ts'),
      crypto: path.resolve(__dirname, 'src/modules/crypto.ts'),
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
