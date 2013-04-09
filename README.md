# node-task
> A specification for stateless, promise-based, event emitting, javascript tasks.

**WORK IN PROGRESS, FEEDBACK WELCOME**

This project aims to define a stateless, promise-based, event emitting API for javascript tasks. Modules which adhere to this specification should be published as stand-alone packages on npm. The target for this spec includes file-based tasks, internal CLI front ends, and most exciting of all: plugins for the fantastic javascript build-tool Grunt (coming with version 0.5+).

Eventually, it is hoped that popular JS libraries will maintain their own node-task modules (think jshint, stylus, handlebars, etc). If/when this happens, it will be trivial to pass files through an arbitrary pipeline of interactions and transformations utilizing libraries across the entire npm ecosystem.

#### Task runners currently committed to supporting this spec:
* [Grunt](http://gruntjs.com/)
* [Brunch](http://brunch.io)
* [Automaton](http://indigounited.com/automaton/)

# basic specification
> Perform an arbitrary task.

Modules which implement the **basic** node-task specification must provide a constructor which can be called to create a unique instance of an object with the following API.

*__≈__ denotes an __optional__ method or property.*

### name ≈
A single word name for task.

### description ≈
A short description of the job the task will perform.

### version ≈
A valid [semver](http://semver.org/) string.

### options ≈
If a task allows options, they must be enumerated under this property as an object where the key is the option name and the value is an object which contains, at a minimum, key/value pairs for `description` and `default`.  This property is primarily intended for task runner introspection, but authors are encouraged to use it for applying default values in `parseConfig`.

### on(event, listener)
An EventEmitter compatible `on` method.  In order to allow parallel execution by task runners, this method must assign listeners to a unique instance of the task.

### off(event, listener)
An EventEmitter compatible `off` method.  In order to allow parallel execution by task runners, this method must remove listeners from a unique instance of the module.

### emit(emit, arg1, arg2, ...)
An EventEmitter compatible `emit` method.  In order to allow parallel execution by task runners, this method must emit events for a unique instance of the module.

### run(config)
Execute a task. Must emit a `run` event with `config` as the first argument before processing task operations. A promise representing the completion of the task must be returned.

### parseConfig(config) ≈
Normalize task configuration, returning the modified config with any with any defaults from `options` applied. Before processing, must emit `parseConfig` event with the source `config` as the first argument.

### setup(config) ≈
Pre-task operations, if any, occur here. Before processing, must emit `setup` event with `config` as the first argument.

### teardown(config) ≈
Post-task operations, if any, occur here. Before processing, must emit `teardown` event with `config` as the first argument.

## Examples

*Note: While the following examples meet the requirements of the __basic__ spec, they should not be considered the only correct way to implement a compliant module.  Task runners will undoubtedly provide builders to facilitate the creation of tasks.*

A minimal compliant module:
```js
var when = require('when');
var util = require('util');
var EventEmitter = require('events').EventEmitter;

var Task = function Task() {
  EventEmitter.call(this);
};
util.inherits(Task, EventEmitter);

Task.prototype.run = function (config) {
  this.emit('run', config);
  return when(true);
};

module.exports = Task;
```

A more comprehensive implementation:
```js
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
```

# logging specification

The following standard events are available for task authors and logger implementers.  **totally incomplete**

* `debug` - Debug mode logging.
* `info` - Verbose mode logging.
* `log` - Standard mode logging.
* `success` - Standard mode logging.
* `warn` - Standard mode non-critical error logging.
* `error` - Standard mode critical error logging.


# buffer interface specification
> A buffer interface for piping data between tasks.

For tasks which operate on files, each input should be loaded using a node-task compliant buffer.  A valid interface is a [Node.js Buffer] instance with the following additional APIs.  *Please see [node-datapipe], [node-filebuffer] & [node-s3buffer] for actual implementations.*

### source
An property identifying the buffer's source: filepath, url, object, etc.

### encoding
String property containing buffer's encoding.

### clone()
Return a clone of the instance.

### content(input)
Fill buffer synchronously and return self for chaining.  Input may be any Buffer, or a string which is valid for the instance's encoding.

### load(opts)
Read contents of source into buffer and return a promise which resolves to self.  If any additional parameters are required for loading (i.e. providing a s3 client), they can be passed in via opts.  If the buffer already contains data this should immediately return a promise which resolves to self.  This is a noop until extended (see [node-filebuffer] and [node-s3buffer] for examples).

### save(opts)
Write contents of buffer to source and return a promise which resolves to self.  If any additional parameters are required for saving (i.e. providing a s3 client, acl settings, etc), they can be passed via opts.  This is a noop until extended (see [node-filebuffer] and [node-s3buffer] for examples).

### pipe(method)
Load data into buffer (if not already loaded) and process it with `method`, yielding a promise which resolves to `methods`'s return value.

[Node.js Buffer]: http://nodejs.org/api/buffer.html
[node-datapipe]: https://github.com/node-task/datapipe/blob/master/lib/datapipe.js
[node-filebuffer]: https://github.com/node-task/filebuffer/blob/master/lib/filebuffer.js
[node-s3buffer]: https://github.com/node-task/s3buffer/blob/master/lib/s3buffer.js
