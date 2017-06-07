(function(){
  "use strict";

  var gulp = require("gulp");
  var sass = require("gulp-sass");
  var browserify = require("browserify");
  var source = require("vinyl-source-stream");
  var tsify = require("tsify");
  var watchify = require("watchify");
  var gutil = require("gulp-util");

  gulp.task("sass", function () {
    return gulp.src("./src/*.scss")
      .pipe(sass({outputStyle: "compressed"}).on("error", sass.logError))
      .pipe(gulp.dest("./dist"));
  });

  gulp.task("sass:watch", function () {
    gulp.watch("./src/*.scss", ["sass"]);
  });

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
      .pipe(gulp.dest("dist"));
  }

  gulp.task("default", ["sass:watch"], bundle);

  watchedBrowserify.on("update", bundle);
  watchedBrowserify.on("log", gutil.log);
}());
