/*
 * task
 * http://gruntjs.com/
 *
 * Copyright (c) 2012 Tyler Kellen, contributors
 * Licensed under the MIT license.
 */

'use strict';
// External libs
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
  Possible task modes.
*/
Task.FILEWRITER = 100;
Task.FILEREADER = 200;
Task.FILEITERATOR = 300;

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
  Default file reader for task.
*/
Task.prototype.file = require('grunt').file;

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
Task.prototype.readFile = function (config, filepath) {
  this.emitter.emit('readFile', config, filepath);
  return this.file.read(filepath, config);
};

/**
  Standard single file write.  Respect options like dry
  run here.

  Task writers should not override this.
*/
Task.prototype.writeFile = function (config, input, filepath) {
  this.emitter.emit('writeFile', config, input, filepath);
  if (config.flags && config.flags.dryRun) {

  } else {
    return this.file.write(filepath, input, config);
  }
};

/**
  Read and process files.  Return an array of modified
  values or promises to retrieve them.

  Task writers should not override this.
*/
Task.prototype.readFileSet = function (config, input) {
  this.emitter.emit('readFileSet', config, input);
  return array(input).map(function (filepath) {
    // if this task only iterates files, trigger that we saw it and skip
    if (this.type === Task.FILEITERATOR) {
      this.emitter.emit('iterateFile', config, filepath);
      this.iterateFile(config, filepath);
      return true;
    }
    var content = this.readFile(config, filepath);
    // emit filterRead here because users will override it
    this.emitter.emit('filterRead', config, input);
    return this.filterRead(config, content, filepath);

  }, this);
};

/**
  Iterate file groups, processing and writing results for each.

  Task writers should not override this.
*/
Task.prototype.processFiles = function (config) {
  var self = this;
  this.emitter.emit('processFiles', config);
  // map all src/dest pairs to a promise for completion
  var complete = Object.keys(config.files).map(function(filepath) {
    var defer = when.defer();
    // read fileset and filter it
    var files = self.readFileSet(config, config.files[filepath]);

    if (self.type === Task.FILEWRITER) {
      // when all promises are resolved, filter result
      var filteredContent = when.all(files).then(function(content) {
      return self.filterWrite(config, content, filepath);
      });
      // when filtering is complete, write files
      when(filteredContent).then(function(content) {
        self.writeFile(config, content, filepath);
        defer.resolve(true);
      });
    } else {
      defer.resolve(true);
    }

    return defer;
  });

  // return an array of promises that represents the
  // completion status for each file grouping
  return complete;
};

/**
  Pre-task stuff goes here.

  The task runner is responsible for emitting the setup
  event when running a task.

  Task writers should override this.
*/
Task.prototype.setup = function (config) {

};

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
Task.prototype.filterRead = function(config, input, filepath) {
  return input;
};

/**
  Process an array of file contents before it is written to the
  destination file.  Can return a promise or a value.

  Task writers should override this.
*/
Task.prototype.filterWrite = function (config, input, filepath) {
  return input.join("");
};

/*
  Standard reference to iterating over a file.  Return true to use
  file, return false to ignore.

  Task writers should override this.
*/
Task.prototype.filterFile = function(config, filepath) {
  return true;
};

/*
  Standard task method.  Assumes task will deal with files, but
  can be the entry point for any sort of work.

  Task writers should override this.
*/
Task.prototype.method = function (config) {
  return this.processFiles(config);
};

/**
  Standard task run.  This can be overridden if the task does not
  deal with files, or if special handling is needed.  Config value
  that arrives should be cloned by task-runner, it can be

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
  var self = this;
  var defer = when.defer();
  config = self.parseConfig(config);
  self.emitter.emit('setup', config);
  self.setup(config);
  when(self.method(config)).then(function (result) {
    self.emitter.emit('teardown', config);
    self.teardown(config);
    defer.resolve(result);
  });
  return defer;
};

// task runner only knows about run

