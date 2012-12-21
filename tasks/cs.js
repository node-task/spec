/*
 * task
 * http://gruntjs.com/
 *
 * Copyright (c) 2012 Tyler Kellen, contributors
 * Licensed under the MIT license.
 */
'use strict';

var Task = require('../lib/task');
var cs = require('coffee-script');

var task = {};

task.name = 'coffeescript';
task.description = 'Compile JS to CS.';
task.type = Task.FILEWRITER;

task.filterRead = function(config, input, filepath) {
  return cs.compile(input, config.options);
};

module.exports = Task.create(task);
