'use strict';

var Task = require('../lib/task');

exports.exists = function(test) {
  test.expect(1);
  test.notEqual(Task, undefined, 'should be defined.');
  test.done();
};

exports.constructor = function(test) {
  test.expect(1);
  var task = new Task();
  test.equals(task.constructor, Task);
  test.done();
};
