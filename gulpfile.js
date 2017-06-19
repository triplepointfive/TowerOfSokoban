(function(){
  "use strict";

  var gulp = require("gulp");
  var browserify = require("browserify");
  var source = require("vinyl-source-stream");
  var tsify = require("tsify");
  var watchify = require("watchify");
  var gutil = require("gulp-util");

  var b = browserify()
    .add("src/index.ts")
    .plugin(tsify);

  var watchedBrowserify = watchify(b);

  function bundle() {
    return watchedBrowserify
      .transform("browserify-shim")
      .bundle()
      .pipe(source("bundle.js"))
      .pipe(gulp.dest("source/javascripts"));
  }

  gulp.task("default", bundle);

  watchedBrowserify.on("update", bundle);
  watchedBrowserify.on("log", gutil.log);
}());
