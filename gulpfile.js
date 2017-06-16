(function(){
  "use strict";

  var gulp = require("gulp");
  var browserify = require("browserify");
  var source = require("vinyl-source-stream");
  var tsify = require("tsify");
  var watchify = require("watchify");
  var gutil = require("gulp-util");

  var watchedBrowserify = watchify(browserify({
    basedir: ".",
    debug: true,
    entries: ["src/index.tsx"],
    cache: {},
    packageCache: {}
  }).plugin(tsify));

  function bundle() {
    return watchedBrowserify
      .bundle()
      .pipe(source("bundle.js"))
      .pipe(gulp.dest("source/javascripts"));
  }

  gulp.task("default", bundle);

  watchedBrowserify.on("update", bundle);
  watchedBrowserify.on("log", gutil.log);
}());
