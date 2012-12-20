# node-task
> A standard node task.

For [Grunt 0.5](/gruntjs/grunt/wiki/Grunt-0.5)

### Compiling Coffee-Script
```js
'use strict';

var Task = require('../lib/task');
var cs = require('coffee-script');

var task = {};

task.name = 'coffeescript';
task.description = 'Compile JS to CS.';

task.filterRead = function(input, filepath, config) {
  return cs.compile(input, config.options);
};

module.exports = Task.create(task);
```

### Compiling Stylus (async)
```js
'use strict';

var Task = require('../lib/task');
var stylus = require('stylus');

var task = {};

task.name = 'stylus';
task.description = 'Compile Stylus to CSS.';

task.filterRead = function(input, filepath, config) {
  var s = stylus(input);
  var defer = Task.defer();
  s.render(function(err, css) {
    defer.resolve(css);
  });
  return defer;
};

module.exports = Task.create(task);
```

---
Copyright (c) 2012 Tyler Kellen. See LICENSE for further details.
