/*
 * task
 * http://gruntjs.com/
 *
 * Copyright (c) 2012 Tyler Kellen, contributors
 * Licensed under the MIT license.
 */
'use strict';

var Task = require('../lib/task');
var jshint = require('jshint');

var task = {};

task.name = 'jshint';
task.description = 'Validate files with JSHint.';
task.type = Task.FILEREADER;

task.processConfig = function (config) {
  var options = config.options;

  // Read JSHint options from a specified jshintrc file.
  if (options.jshintrc) {
    options = Task.file.readJSON(options.jshintrc);
  }
  // If globals weren't specified, initialize them as an empty object.
  if (!options.globals) {
    options.globals = {};
  }
  // Convert deprecated "predef" array into globals.
  if (options.predef) {
    options.predef.forEach(function(key) {
      options.globals[key] = true;
    });
  }
  return config;
};

task.filterRead = function (config, input, filepath) {
  return true;
};

module.exports = Task.create(task);
