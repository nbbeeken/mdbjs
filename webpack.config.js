// Generated using webpack-cli https://github.com/webpack/webpack-cli

const path = require("path");

const isProduction = process.env.NODE_ENV == "production";

const config = {
  entry: "./src/index.ts",
  devtool: 'source-map',
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
      url: path.resolve(__dirname, 'src/modules/url.ts'),
      net: path.resolve(__dirname, 'src/modules/net.ts'),
      timers: path.resolve(__dirname, 'src/modules/timers.ts'),
      stream: path.resolve(__dirname, 'src/modules/stream.ts'),
      buffer: path.resolve(__dirname, 'src/modules/buffer.ts'),
      util: path.resolve(__dirname, 'src/modules/util.ts'),
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
