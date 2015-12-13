import path from 'path';

import gulp from 'gulp';
import gutil from 'gulp-util';
import eslint from 'gulp-eslint';

import webpack from 'webpack';
import express from 'express';
import webpackDevMiddleware from 'webpack-dev-middleware';
import webpackHotMiddleware from 'webpack-hot-middleware';
import rimraf from 'rimraf';

// Basic webpack config for our dev enviroment
const webpackConfigDev = {
  devtool: 'cheap-module-eval-source-map',
  entry: [
    'webpack-hot-middleware/client',
    './src/index',
  ],
  output: {
    path: path.join(__dirname, 'dist'),
    filename: 'bundle.js',
    publicPath: '/static/',
  },
  plugins: [
    new webpack.HotModuleReplacementPlugin(),
    new webpack.NoErrorsPlugin(),
  ],
  module: {
    loaders: [
      {
        test: /\.js$/,
        loaders: ['babel'],
        include: path.join(__dirname, 'src'),
      },
    ],
  },
};

// Make some overrides for our production builds
const webpackConfigProd = {
  ...webpackConfigDev,
  devtool: 'source-map',
  entry: './src/index',
  plugins: [
    new webpack.optimize.OccurenceOrderPlugin(),
    new webpack.DefinePlugin({
      'process.env': {
        'NODE_ENV': JSON.stringify('production'),
      },
    }),
    new webpack.optimize.UglifyJsPlugin({
      compressor: {
        warnings: false,
      },
    }),
  ],
};

// Print the results of a webpack build
function printWebpackResults(stats) {
  gutil.log('[webpack]', stats.toString({
    colors: true,
    hash: true,
    timings: true,
    chunks: true,
    assets: true,

    version: false,
    chunkModules: false,
    modules: false,
    cached: false,
    reasons: false,
    source: false,
    errorDetails: false,
    chunkOrigins: false,
    modulesSort: false,
    chunksSort: false,
    assetsSort: false,
  }));
}

// Build with dev enviroment
gulp.task('build', ['clean'], function (callback) {
  webpack(webpackConfigDev, function (err, stats) {
    if (err) {
      throw new gutil.PluginError('webpack', err);
    }

    printWebpackResults(stats);

    callback();
  });
});

// Build with prod enviroment
gulp.task('build:prod', ['clean'], function (callback) {
  webpack(webpackConfigProd, function (err, stats) {
    if (err) {
      throw new gutil.PluginError('webpack', err);
    }

    printWebpackResults(stats);

    callback();
  });
});

// Clean up
gulp.task('clean', function (callback) {
  rimraf('dist/', callback);
});

// Lint the files
gulp.task('lint', function () {
  gulp.src('src/**/*.js')
    .pipe(eslint())
    .pipe(eslint.format());
});

// Start the dev server
gulp.task('server', function () {
  const app = express();
  const compiler = webpack(webpackConfigDev);

  app.use(webpackDevMiddleware(compiler, {
    noInfo: true,
    publicPath: webpackConfigDev.output.publicPath,
  }));

  app.use(webpackHotMiddleware(compiler));

  app.get('*', function (req, res) {
    res.sendFile(path.join(__dirname, 'index.html'));
  });

  app.listen(3141, 'localhost', function (err) {
    if (err) {
      gutil.log(err);
      return;
    }

    gutil.log('Listening at http://localhost:3141');
  });
});

gulp.task('default', ['server']);
