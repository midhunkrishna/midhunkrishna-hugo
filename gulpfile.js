var gulp         = require("gulp"),
    sass         = require("gulp-sass"),
    autoprefixer = require("gulp-autoprefixer"),
    hash         = require("gulp-hash"),
    del          = require("del"),
    concat       = require('gulp-concat');


// Hash javascript
gulp.task("js", function () {
  del(["themes/journey/static/js/**/*"]);

  gulp.src("src/js/**/*")
    .pipe(concat('main.js'))
    .pipe(hash())
    .pipe(gulp.dest("themes/journey/static/js"))
    .pipe(hash.manifest("hash.json"))
    .pipe(gulp.dest("data/js"));
});

gulp.task("images", function () {

  del(["themes/journey/static/images/**/*"]);
  gulp.src("src/images/**/*")
    .pipe(hash())
    .pipe(gulp.dest("themes/journey/static/images"))
    .pipe(hash.manifest("hash.json"))
    .pipe(gulp.dest("data/images"));
});

// Compile SCSS files to CSS
gulp.task("scss", function () {

  del(["themes/journey/static/css"]);

  gulp.src("src/scss/**/*.scss")
    .pipe(sass({
      outputStyle : "compressed"
    }))
    .pipe(autoprefixer({
      browsers : ["last 20 versions"]
    }))
    .pipe(hash())
    .pipe(gulp.dest("themes/journey/static/css"))
    .pipe(hash.manifest("hash.json"))
    .pipe(gulp.dest("data/css"));
});

// Watch asset folder for changes

gulp.task("watch", ["scss", "images", "js"], function () {
  gulp.watch("src/scss/**/*", ["scss"]);
  gulp.watch("src/images/**/*", ["images"]);
  gulp.watch("src/js/**/*", ["js"]);
});

// Set watch as default task
gulp.task("default", ["watch"]);
