# node-task
> A specification for stateless, promise-based, event emitting, javascript tasks.

**WORK IN PROGRESS, FEEDBACK WELCOME**

This project aims to define a stateless, promise-based API for javascript tasks. Modules which adhere to this specification should be published as stand-alone packages on npm. The target for this spec includes file-based tasks, internal CLI front ends, and most exciting of all: plugins for the fantastic javascript build-tool Grunt (coming with version 0.5+).

Eventually, it is hoped that popular JS libraries will maintain their own node-task modules (think jshint, stylus, handlebars, etc). If/when this happens, it will be trivial to pass files through an arbitrary pipeline of interactions and transformations utilizing libraries across the entire npm ecosystem.

#### __≈__ denotes an __optional__ method or property

# basic specification
> Perform an arbitrary task.

The following comprises the API for modules which implement the **basic** node-task specification.

The most minimal possible example of a compliant module:
```js
var when = require('when');
var task = module.exports = {};
task.name = 'nothing';
task.description = 'this task does absolutely nothing';
task.version = '0.1.0';
task.emitter = new (require('events').EventEmitter);
task.options = [];
task.run = function (config) {
  this.emitter.emit('run', config);
  return when(true);
};

// basic tasks can be invoked with any configuration value required
task.run();
task.run(true);
task.run({ option: true });
```

### name
A single word name for task.  *Generally utilized by task runners.*

### description
A short description of the job the task will perform.

### version
A valid [semver](http://semver.org/) string.

### emitter
An instance of a EventEmitter compatible API.

### options ≈
An array of objects enumerating possible options and their default values.

Example:
```js
task.options = [
  {
    name: "option1",
    description: "Description of option 1"
    default: false
  },
  {
    name: "option2",
    description: "description of option 2",
    default: true
  }
]
```

### run(config)
Execute a task. Must emit a `run` event with `config` as the first argument before processing task operations. A promise representing the completion of the task must be returned.

### parseConfig(config) ≈
Normalize task configuration returning the modified config with any with any defaults from `options` applied. Before processing, must emit `parseConfig` event with the source `config` as the first argument.

### setup(config) ≈
Pre-task operations occur here. Before processing, must emit `setup` event with `config` as the first argument.

### teardown(config) ≈
Post-task operations occur here. Before processing, must emit `teardown` event with `config` as the first argument.

# reader specification
> Iterate over input, performing read-only operations.

Including the **basic** specification, the following comprises the API for modules which implement the node-task **reader** specification.

Forthcoming.

# writer specification
> Iterate over input, performing read/write operations.

Forthcoming.
