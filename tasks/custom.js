'use strict';

var Task = require('../lib/task');

var task = {};

task.name = 'whatever';
task.description = 'Echos your config back to you.';
task.method = function (config) {
  console.log(config);
  return true;
};

module.exports = Task.create(task);