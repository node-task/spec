/*
 * task
 * http://gruntjs.com/
 *
 * Copyright (c) 2012 Tyler Kellen, contributors
 * Licensed under the MIT license.
 */

'use strict';
// External libs
var file = require('grunt').file;
var _ = require('lodash');
var when = require('when');
var array = require('ensure-array');

/**
  Standard node task constructor.

  @class Task
*/
var Task = module.exports = function (config) {
  this.init(config);
};

/**
  Create a standard node task.
*/
Task.create = function () {
  // combine all arguments (allows mixins)
  Array.prototype.unshift.call(arguments, {});
  var config = _.extend.apply(this, arguments);
  // return task object
  return new Task(config);
};
Task.when = when;
Task.defer = when.defer;

/**
  Apply configuration when constructing task.
*/
Task.prototype.init = function (config) { _.extend(this, config); };

/**
  The task's event emitter.

  @type {String}
  @static emitter
*/
Task.prototype.emitter = new (require('eventemitter2').EventEmitter2)();

/**
  Standard single file read.  Check for existence and
  respect options like verbosity / dryRun etc here.
  Probably need some handling here for binary files.

  Task writers should not override this.
*/
Task.prototype.readFile = function (filepath, config) {
  this.emitter.emit('readFile', filepath, config);
  return file.read(filepath, config);
};

/**
  Standard single file write.  Respect options like dry
  run here.

  Task writers should not override this.
*/
Task.prototype.writeFile = function (filepath, content, config) {
  this.emitter.emit('writeFile', filepath, content, config);
  if (config.flags && config.flags.dryRun) {

  } else {
    return file.write(filepath, content, config);
  }
};

/**
  Read and process files.  Return an array of modified
  values or promises to retrieve them.

  Task writers should not override this.
*/
Task.prototype.readFileSet = function (input, config) {
  return array(input).map(function (filepath) {
    var content = this.readFile(filepath, config);
    // emit filterRead here because users will override it
    this.emitter.emit('filterRead', content, filepath, config);
    return this.filterRead(content, filepath, config);
  }, this);
};

/**
  Iterate file groups, processing each.

  Task writers should not override this.
*/
Task.prototype.processFiles = function (config) {
  var self = this;
  this.emitter.emit('processFiles', config);
  Object.keys(config.files).forEach(function(dest) {
    // read fileset and filter it
    var files = self.readFileSet(config.files[dest], config);
    // when all promises are resolved, write the result
    when.all(files).then(function(contents) {
      // filter file contents before writing
      contents = self.filterWrite(contents, dest, config);
      when(contents).then(function(output) {
        // write destination file
        self.writeFile(dest, output, config);
      });
    });
  });
};

/**
  Pre-task stuff goes here.

  The task runner is responsible for emitting the setup
  event when running a task.

  Task writers should override this.
*/
Task.prototype.setup = function (config) {};

/**
  Post-task stuff goes here.

  The task runner is responsible for emitting the teardown
  event when running a task.

  Task writers should override this.
*/
Task.prototype.teardown = function (config) {};

/**
  Parse config to add defaults, etc.  The task runner should
  call this with a deep clone of the configuration object
  before executing a task.  The return value is what the task
  runner passes to the 'setup/run/teardown' methods.

  Task writers should override this.
*/
Task.prototype.parseConfig = function (config) {
  return config;
};

/**
  Process the contents of individual files as they come in.
  Can return a promise or a value.

  Task writers should override this.
*/
Task.prototype.filterRead = function(input, filepath, config) {
  return input;
};

/**
  Process an array of file contents before it is written to the
  destination file.  Can return a promise or a value.

  Task writers should override this.
*/
Task.prototype.filterWrite = function (input, filepath, config) {
  return input.join("\n");
};

/**
  Standard task run.  This can be overridden if the task does not
  deal with files, or if special handling is needed.

  Because users can override this method, the task runner is
  responsible for emitting 'run' when calling this method.

  // sample config
  var config = {
    files: {
      'dest': ['input.txt']
    },
    options: {}, // task options
    flags: {}    // runner flags
  }
*/
Task.prototype.run = function (config) {
  config = this.parseConfig(config);
  this.processFiles(config);
};
