var gulp = require('gulp');

// Plugins.
var jshint = require('gulp-jshint');
var stylish = require('jshint-stylish');
var sass = require('gulp-sass');
var concat = require('gulp-concat');
var uglify = require('gulp-uglify');
var ngAnnotate = require('gulp-ng-annotate');
var rename = require('gulp-rename');
var yaml = require('js-yaml');
var fs = require('fs');
var header = require('gulp-header');

var adminBuildDir = 'Resources/public/assets/build';
var templatesPath = 'Resources/public/templates/';

// Get information for top of minified files.
var pkg = require('./version.json');
var banner = [
  '/**',
  ' * @name <%= pkg.name %>',
  ' * @version v<%= pkg.version %>',
  ' * @link <%= pkg.link %>',
  ' */',
  ''
].join('\n');

// @TODO: Discover this structure automatically
var templates = {
  'horizon': {
    'slides': [
      'horizon-image-text',
      'horizon-image-text-2x',
      'horizon-calendar-info',
      'horizon-calendar-list',
      'horizon-calendar-single'
    ]
  }
};

/**
 * Process SCSS using libsass
 */
gulp.task('sass', function (done) {
  'use strict';

  // Iterates through the screen and slide templates defined in templates variable, and compresses each one.
  for (var folder in templates) {
    for (var templateType in templates[folder]) {
      var arr = templates[folder][templateType];

      arr.forEach(function (element) {
        var path = templatesPath + folder + '/' + templateType + '/' + element + '/';

        gulp.src(path + element + '.scss')
        .pipe(sass({
          outputStyle: 'compressed',
          includePaths: [
            'Resources/sass/compass-mixins/lib'
          ]
        }).on('error', sass.logError))
        .pipe(gulp.dest(path));
      });
    }
  }

  done();
});

// We only want to process our own non-processed JavaScript files.
var adminJsPath = (function () {
  var configFiles = [
      'Resources/config/angular.yml'
    ],
    jsFiles = [],

    // Breadth-first descend into data to find "files".
    buildFiles = function (data) {
      if (typeof(data) === 'object') {
        for (var p in data) {
          if (p === 'files') {
            jsFiles = jsFiles.concat(data[p]);
          }
          else {
            buildFiles(data[p]);
          }
        }
      }
    };

  configFiles.forEach(function (path) {
    var data = yaml.safeLoad(fs.readFileSync(path, 'utf8'));
    buildFiles(data);
  });

  return jsFiles.map(function (file) {
    return 'Resources/public/' + file.split('bundles/os2displayhorizontemplate/')[1];
  });
}());

/**
 * Run Javascript through JSHint.
 */
gulp.task('jshint', function () {
  return gulp.src(adminJsPath)
  .pipe(jshint())
  .pipe(jshint.reporter(stylish));
});

/**
 * Build single app.js file.
 */
gulp.task('js', function () {
    return gulp.src(adminJsPath)
    .pipe(concat('os2displayhorizontemplate.js'))
    .pipe(ngAnnotate())
    .pipe(uglify())
    .pipe(rename({extname: ".min.js"}))
    .pipe(header(banner, {pkg: pkg}))
    .pipe(gulp.dest(adminBuildDir));
  }
);

/**
 * Build single app.js file.
 */
gulp.task('js-src', function (done) {
  adminJsPath.forEach(function (path) {
    process.stdout.write(path + '\n');
  });

  done();
});
