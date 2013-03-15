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


# input buffer specification
> An enhanced buffer interface for piping data between tasks.

An object with the following properties and methods must be used to represent source data for node-task compliant modules to operate on.

### source
A string indicating the absolute source of the input (e.g. filepath, url, etc).

### encoding
A string indicating the encoding of the input (e.g. utf8, ascii, etc).

### buffer
The underlying [buffer](http://nodejs.org/api/buffer.html).

### load(source)
Load an input source into `buffer` and return a promise which resolves to the parent object.

### read(encoding)
Return the underlying buffer, or, if an encoding is available, its string value.

A minimally compliant class for constructing input objects:
```js
var path = require('path');
var fs = require('fs');
var when = require('when');

var FileBuffer = function (encoding) {
  this.encoding = encoding;
  this.source = null;
  this.buffer = null;
};

FileBuffer.prototype.load = function (source) {
  var self = this;
  this.source = path.resolve(source);
  this.buffer = fs.readFileSync(this.source);
  return when(this.buffer).then(function() {
    return self;
  });
};

FileBuffer.prototype.read = function (encoding) {
  if(!encoding || this.buffer === null) {
    return this.buffer;
  } else {
    return this.buffer.toString(encoding);
  }
};

module.exports = FileBuffer;
```

Sample usage:
```js
var FileBuffer = require('./lib/filebuffer');
var buffer = new FileBuffer('utf8');
buffer.load('README.md').then(function(file) {
  console.log('The contents of '+file.source+' are:\n'+file.read());
});
```

The above example is implemented in the npm package [filebuffer](http://github.com/tkellen/node-filebuffer).

# reader specification
> Iterate over input, performing read-only operations.

Including the **basic** specification, the following comprises the API for modules which implement the node-task **reader** specification.

Forthcoming.

# writer specification
> Iterate over input, performing read/write operations.

Including the **reader** specification, the following comprises the API for modules which implement the node-task **writer** specification.

Forthcoming.