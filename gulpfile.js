'use strict';

var _ = require('lodash');
var apidoc = require('apidoc');
var gulp = require('gulp');
var htmlmin = require('gulp-htmlmin');
var inlinesource = require('gulp-inline-source');
var sass = require('gulp-sass');
var template = require('gulp-template');
var through2 = require('through2');

gulp.task('styles', function (cb) {
  gulp.src('src/style.scss')
    .pipe(sass({outputStyle: 'compressed'}))
    .pipe(gulp.dest('.tmp'))
    .on('end', cb);
});

function loadData() {
  apidoc.createDoc({
    src: '../mosquito-report-api',
    dest: '.tmp/api/',
    silent: true
  });

  return _.chain(require('./.tmp/api/api_data.json'))
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

  var menu = '';

  var groupPromises = [];

  loadData().map(function (group) {
    menu += '<li><a href="#' + group.name + '">' + group.title + '</a><ol>';

    var endpointPromises = [];

    group.endpoints.map(function (endpoint) {

      var parameterPromises = [];

      if (endpoint.parameter) {
        endpoint.parameter.fields.Parameter.map(function (parameter) {
          parameterPromises.push(new Promise(function (resolve) {
            gulp.src('./src/parameter.html')
              .pipe(template(parameter))
              .on('data', function (data) {
                resolve(data.contents.toString());
              });
          }));
        });
      }

      endpointPromises.push(new Promise(function (resolve) {
        Promise.all(parameterPromises).then(function (parameters) {
          endpoint.parameters = parameters.join('');

          if (endpoint.parameters) {
            endpoint.parameters = '<h4>Parameters</h4><table class="table"><thead><th>Name</th><th>Type</th><th>Description</th></thead><tbody>' + endpoint.parameters + '</tbody></table>';
          }

          if (parameters.examples) {
            endpoint.example = '<h4>Example</h4><div class="panel panel-default"><div class="panel-body"><pre>' + parameter.examples[0].content + '</pre></div></div>';
          } else {
            endpoint.example = '';
          }

          if (endpoint.success.examples[1]) {
            endpoint.response = '<pre class="panel-body">' + endpoint.success.examples[1].content + '</pre>';
          } else {
            endpoint.response = '';
          }

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
      .pipe(gulp.dest('.tmp'))
      .on('end', endCb);
  });
});

gulp.task('default', ['html', 'styles'], function () {
  gulp.src('.tmp/index.html')
    .pipe(inlinesource())
    .pipe(gulp.dest('dist'));
});
