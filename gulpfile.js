'use strict';

var apidoc = require('apidoc');
var gulp = require('gulp');
var htmlmin = require('gulp-htmlmin');
var sass = require('gulp-sass');
var template = require('gulp-template');
var through2 = require('through2');

gulp.task('styles', function () {
  gulp.src('src/style.scss')
    .pipe(sass({outputStyle: 'compressed'}))
    .pipe(gulp.dest('dist'));
});

function loadData() {
  apidoc.createDoc({
    src: '../mosquito-report-api',
    dest: '.tmp/'
  });

  return require('./.tmp/api_data.json').reduce(function (reduced, x) {
    reduced[x.group] = reduced[x.group] || {}; 
    reduced[x.group][x.title] = x;

    return reduced;
  }, {});
}

gulp.task('html', function(endCb) {

  console.log(loadData());

  var groupsHtml = '<a href>HTML</a>';

  gulp.src('src/index.html')
    .pipe(template({ groups: groupsHtml }))
    .pipe(htmlmin({collapseWhitespace: true}))
    .pipe(gulp.dest('dist'))
    .on('end', endCb);
});

gulp.task('default', ['styles', 'html'], function () {
});
