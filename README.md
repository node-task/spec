# node-task
> A specification for stateless, promise-based, event emitting, javascript tasks.

**WORK IN PROGRESS, FEEDBACK WELCOME**

This project aims to define a stateless, promise-based API for javascript tasks. Modules which adhere to this specification should be published as stand-alone packages on npm. The target for this spec includes file-based tasks, internal CLI front ends, and most exciting of all: plugins for the fantastic javascript build-tool Grunt (coming with version 0.5+).

Eventually, it is hoped that popular JS libraries will maintain their own node-task modules (think jshint, stylus, handlebars, etc). If/when this happens, it will be trivial to pass files through an arbitrary pipeline of interactions and transformations utilizing libraries across the entire npm ecosystem.

#### __≈__ denotes an __optional__ method or property

# basic specification
> Perform an arbitrary task.

The following comprises the API for modules which implement the **basic** node-task specification.

### name ≈
A single word name for task.

### description ≈
A short description of the job the task will perform.

### version ≈
A valid [semver](http://semver.org/) string.

### options ≈
If a task allows options, they must be enumerated under this property as an array of objects with a `name`, `description` and `defaultValue` keys.

### on(event, listener)
An EventEmitter compatible `on` method.

### off(event, listener)
An EventEmitter compatible `off` method.

### emit(emit, arg1, arg2, ...)
An EventEmitter compatible `emit` method.

### run(config)
Execute a task. Must emit a `run` event with `config` as the first argument before processing task operations. A promise representing the completion of the task must be returned.

### parseConfig(config) ≈
Normalize task configuration, returning the modified config with any with any defaults from `options` applied. Before processing, must emit `parseConfig` event with the source `config` as the first argument.

### setup(config) ≈
Pre-task operations, if any, occur here. Before processing, must emit `setup` event with `config` as the first argument.

### teardown(config) ≈
Post-task operations, if any, occur here. Before processing, must emit `teardown` event with `config` as the first argument.

## Examples

The most minimal possible example of a compliant module:
```js
var when = require('when');
var Task = function () {};
Task.prototype = Object.create(require('events').EventEmitter.prototype);
Task.prototype.run = function (config) {
  this.emit('run', config);
  return when(true);
};

module.exports = exports = Task;
```

A more comprehensive implementation:
```js
var _ = require('lodash');
var when = require('when');
var Task = function () {};
Task.prototype = Object.create(require('events').EventEmitter.prototype);
Task.prototype.name = 'example';
Task.prototype.description = 'fake task using all spec properties and methods';
Task.prototype.version = '0.1.0';
Task.prototype.options = [
  { name: "debug", description: "debug mode", defaultValue: false },
  { name: "fake", description: "a fake option", defaultValue: 1 }
];
Task.prototype.parseConfig = function (config) {
  this.emit('parseConfig', config);
  var defaults = _.reduce(this.options, function(result, option) {
    result[option.name] = option.defaultValue;
    return result;
  }, {});
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

module.exports = exports = Task;
```

# logging specification

The following standard events are available for task authors and logger implementers.

* `debug` - Low level debug logging.
* `info` - Verbose logging.
* `success` - Standard logging.
* `warn` - Non-critical error logging.
* `error` - Critical error logging.

# reader specification
> Iterate over input, performing read-only operations.

Including the **basic** specification, the following comprises the API for modules which implement the node-task **reader** specification.

Forthcoming.

# writer specification
> Iterate over input, performing read/write operations.

Including the **reader** specification, the following comprises the API for modules which implement the node-task **writer** specification.

Forthcoming.
