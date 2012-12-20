/*
 * task
 * http://gruntjs.com/
 *
 * Copyright (c) 2012 Tyler Kellen, contributors
 * Licensed under the MIT license.
 */
'use strict';

var Task = require('../lib/task');
var stylus = require('stylus');

var task = {};

task.name = 'stylus';
task.description = 'Compile Stylus files to CSS.';

task.filterRead = function(input, filepath, config) {
  var s = stylus(input);
  var defer = Task.defer();
  s.render(function(err, css) {
    defer.resolve(css);
  });
  return defer;
};


module.exports = Task.create(task);
