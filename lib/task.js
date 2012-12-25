/*
 * task
 * http://taskjs.com/
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
  Constructor.
*/
var Task = module.exports = function (config) {
  this.init(config);
};

/**
  Possible task modes.
*/
Task.FILEWRITER = 'filewriter';
Task.FILEREADER = 'filereader';
Task.FILEITERATOR = 'fileiterator';

/**
  Convenience method for calling constructor.
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
  Default file handler for task.
*/
Task.prototype.file = require('grunt').file;

/**
  Apply configuration when constructing task.

  Task writers should not override this.
*/
Task.prototype.init = function (config) { _.extend(this, config); };

/**
  The task's event emitter.

  Task writers should not override this.
*/
Task.prototype.emitter = new (require('eventemitter2').EventEmitter2)();

/**
  Standard file read.
  Pass options to file lib here.
  Not sure where those options come from?

  Task writers should not override this.
*/
Task.prototype.readFile = function (config, filepath) {
  this.emitter.emit('readFile', config, filepath);
  return this.file.read(filepath, config);
};

/**
  Standard file write.
  Pass options to file lib here.
  Not sure where those options come from?

  Task writers should not override this.
*/
Task.prototype.writeFile = function (config, input, filepath) {
  this.emitter.emit('writeFile', config, input, filepath);
  return this.file.write(filepath, input, config);
};

/**
  Read and process files.  Return an array of modified
  values or promises.

  Task writers should not override this.
*/
Task.prototype.processFileSet = function (config, input) {
  this.emitter.emit('processFileSet', config, input);
  return array(input).map(function (filepath) {
    this._iterateFile(config, filepath);
    // if this task only iterates files, skip out here
    if (this.type === Task.FILEITERATOR) {
      return true;
    }
    var content = this.readFile(config, filepath);
    // emit filterRead here because users will override it
    return this._filterRead(config, content, filepath);
  }, this);
};

/**
  Iterate file groups, processing and writing results for each.
  Return a promise that resolves when all file sets are complete.

  Task writers should not override this.
*/
Task.prototype.processFiles = function (config) {
  var self = this;
  this.emitter.emit('processFiles', config);
  // map all src/dest pairs to a promise for completion
  var complete = Object.keys(config.files).map(function(filepath) {
    var defer = when.defer();
    // process fileset
    var files = self.processFileSet(config, config.files[filepath]);
    // write files if configured to do so
    if (self.type === Task.FILEWRITER) {
      // when all promises are resolved, filter result
      var filteredContent = when.all(files).then(function(content) {
        return self._filterWrite(config, content, filepath);
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
  return when.all(complete);
};

/**
  Main entry point for task.
*/
Task.prototype.run = function (config) {
  var self = this;

  config = self._parseConfig(config);

  return when(self._setup(config)).
         then(self._method(config)).
         then(self._teardown(config), function(err) {
            console.log(err);
         });
};


/**
  Private methods to invoke task methods with events.

  Task writers should not override these.
*/
Task.prototype._parseConfig = function(config) {
  this.emitter.emit('parseConfig', config);
  return this.parseConfig(config);
};
Task.prototype._setup = function(config) {
  this.emitter.emit('setup', config);
  return this.setup(config);
};
Task.prototype._method = function(config) {
  this.emitter.emit('method', config);
  return this.method(config);
};
Task.prototype._teardown = function(config) {
  this.emitter.emit('teardown', config);
  return this.teardown(config);
};
Task.prototype._iterateFile = function(config, filepath) {
  this.emitter.emit('iterateFile', config, filepath);
  return this.iterateFile(config, filepath);
};
Task.prototype._filterRead = function(config, input, filepath) {
  this.emitter.emit('filterRead', config, input, filepath);
  return this.filterRead(config, input, filepath);
};
Task.prototype._filterWrite = function(config, input, filepath) {
  this.emitter.emit('filterWrite', config, input, filepath);
  return this.filterWrite(config, input, filepath);
};

/**
  Parse config to add defaults, etc.

  Task writers should override this.
*/
Task.prototype._parseConfig = function (config) {
  return config;
};

/**
  Use this to run pre-task stuff.
  Can return a promise if needed.

  Task writers should override this.
*/
Task.prototype.setup = function (config) {};

/*
  Task execution goes here.
  Can return a promise if needed.

  Task writers should override this for custom tasks.
**/

Task.prototype.method = function (config) {
  return this.processFiles(config);
};

/*
  Use this to do something with a file that doesn't involve
  reading its contents directly.  Called each time a file is
  iterated over.

  Task writers should override this.
*/
Task.prototype.iterateFile = function(config, filepath) {};


/**
  Use this to augment the contents of individual files as they
  are read in.  Can return a promise if needed.

  Task writers should override this.
*/
Task.prototype.filterRead = function(config, input, filepath) {
  return input;
};

/**
  Use this to augment the contents of a set of files as they
  are being written to a single destination.  Can return a
  promise if needed.

  Task writers should override this.
*/
Task.prototype.filterWrite = function (config, input, filepath) {
  return input.join("");
};

/**
  Use this to run post-task stuff.
  Can return a promise if needed.

  Task writers should override this.
*/
Task.prototype.teardown = function (config) {};