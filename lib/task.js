var when = require('when');
var util = require('util');
var EventEmitter = require('events').EventEmitter;
var _ = require('lodash');

var Task = function Task() {
  EventEmitter.call(this);
};
util.inherits(Task, EventEmitter);

Task.prototype.name = 'example';
Task.prototype.description = 'fake task using all spec properties and methods';
Task.prototype.version = '0.1.0';
Task.prototype.options = {
  debug: {
    description: "debug mode",
    default: false
  },
  fake: {
    description: "a fake option",
    default: 1
  }
};
Task.prototype.parseConfig = function (config) {
  this.emit('parseConfig', config);
  var defaults = _.merge({}, this.options, function(d, o) {
    return o.default;
  });
  return _.extend(defaults, config);
};
Task.prototype.run = function (config) {
  var runConfig = this.parseConfig(config);
  this.emit('setup', runConfig);
  this.emit('run', runConfig);
  this.emit('teardown', runConfig);
  return when(true);
};
Task.prototype.setup = function (config) {
  this.emit('debug', config);
};
Task.prototype.teardown = function (config) {
  this.emit('teardown', config);
};

module.exports = Task;