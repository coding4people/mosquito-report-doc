'use strict';

var _ = require('lodash');
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

  return _.chain(require('./.tmp/api_data.json'))
    .groupBy('group')
    .toPairs()
    .map(function (endpoint) {
      var group = _.zipObject(['name', 'endpoints'], endpoint);
      group.title = group.endpoints[0].groupTitle;

      return group;
    })
    .value();
}

gulp.task('html', function(endCb) {

  var menu = '<ol>';

  var groupPromises = [];

  loadData().map(function (group) {
    menu += '<li><a href="#' + group.name + '">' + group.title + '</a><ol>';

    var endpointPromises = [];

    group.endpoints.map(function (endpoint) {

      var parameterPromises = [];

      endpoint.parameter.fields.Parameter.map(function (parameter) {
        parameterPromises.push(new Promise(function (resolve) {
          gulp.src('./src/parameter.html')
            .pipe(template(parameter))
            .on('data', function (data) {
              resolve(data.contents.toString());
            });
        }));
      });

      endpointPromises.push(new Promise(function (resolve) {
        Promise.all(parameterPromises).then(function (parameters) {
          endpoint.parameters = parameters.join('');
          endpoint.type = endpoint.type.toUpperCase();

          gulp.src('./src/endpoint.html')
            .pipe(template(endpoint))
            .on('data', function (data) {
              resolve(data.contents.toString());
            });
        });
      }));

      menu += '<li><a href="#' + endpoint.group + '_' + endpoint.name + '">' + endpoint.title + '</a></li>';
    });

    groupPromises.push(new Promise(function (resolve) {
      Promise.all(endpointPromises).then(function (endpoints) {
        group.endpoints = endpoints.join('');

        gulp.src('./src/group.html')
          .pipe(template(group))
          .on('data', function (data) {
            resolve(data.contents.toString());
          });
      });
    }));
    menu += '</ol></li>';
  });

  Promise.all(groupPromises).then(function (groups) {
    gulp.src('src/index.html')
      .pipe(template({
        groups: groups.join(''),
        menu: menu
      }))
      .pipe(htmlmin({collapseWhitespace: true}))
      .pipe(gulp.dest('dist'))
      .on('end', endCb);
  });
});

gulp.task('default', ['styles', 'html']);
