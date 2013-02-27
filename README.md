# node-task
> A specification for stateless, promise-based, event emitting, javascript tasks.

**WORK IN PROGRESS, FEEDBACK WELCOME**

This project aims to define a stateless, promise-based, event emitting API for javascript tasks. Modules which adhere to this specification should be published as stand-alone packages on npm. The target for this spec includes file-based tasks, internal CLI front ends, and most exciting of all: plugins for the fantastic javascript build-tool Grunt (coming with version 0.5+).

Eventually, it is hoped that popular JS libraries will maintain their own node-task modules (think jshint, stylus, handlebars, etc). If/when this happens, it will be trivial to pass files through an arbitrary pipeline of interactions and transformations utilizing libraries across the entire npm ecosystem.

#### Task runners currently committed to supporting this spec:
* [Grunt](http://gruntjs.com/)
* [Brunch](http://brunch.io)
* [Automotan](https://github.com/IndigoUnited/automaton)

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


# reader specification
> Iterate over input, performing read-only operations.

Including the **basic** specification, the following comprises the API for modules which implement the node-task **reader** specification.

### contentType
The type of content the task should read.  Task runners should abort if a pipeline is created that would route data through incompatible types.  Typical values would be `utf8` and `binary`.

### bufferize(config)
Iterate over input defined in configuration, reading each into a buffer.  Before processing, must emit `bufferize` event with `config` as the first argument.  Sources may be specified in any form (files, urls, etc) under the `input` key of `config`.  They should be stored as an array of objects with, at minimum, a `src` key holding an array of inputs.

Example input:  *this format could probably be simplified*
```js
[
  { src: ['path/to/file1','path/to/file2'] },
  // an array should always be used, even if there is only one source
  { src: ['path/to/other/file3'] }
]
```

The method must return a return a promise which resolves to an "bufferized" input object of the following form:
```js
[
  {
    src: [ {name:'path/to/file/1', content:<buffer>},
           {name:'path/to/file2', content:<buffer>} ]
  },
  {
    src: [ {name:'path/to/other/file3', content:<buffer>} ]
  }
]
```
*If "bufferized" input is provided in the task configuration up front (in the case of chaining tasks, for example), this method may be skipped.*


### read(input)
Take an input identifier and return a buffer with its contents.  Before processing, must emit `read` event with `input` as the first argument.  This method should be called by `bufferize` as it iterates through input sources.

### filterRead(config, input)
Perform read-only operations on a "bufferized" source object.  Before processing, must emit `filterRead` event with `config` as the first argument and `input` as the second.  Input must be defined as an object in the following form:

```js
{ name: 'identifier', content: <buffer> }
```

# writer specification
> Iterate over input, performing read/write operations.

Including the **reader** specification, the following comprises the API for modules which implement the node-task **writer** specification.

Forthcoming.