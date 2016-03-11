'use strict';

var gulp = require('gulp');
var apidoc = require('apidoc');

gulp.task('default', [], function () {
  apidoc.createDoc({
    src: '../mosquito-report-api',
    dest: './.tmp/'
  });

  var data = require('./.tmp/api_data.json');
});
