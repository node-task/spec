/*
 * node-task
 * http://github.com/tkellen/node-task
 *
 * Copyright (c) 2012 Tyler Kellen, contributors
 * Licensed under the MIT license.
 */

'use strict';

// Node libs
var fs = require('fs');
var path = require('path');

// External libs
var _ = require('lodash');
var when = require('when');
var array = require('ensure-array');
var iconv = require('iconv-lite');
var mkdirp = require('mkdirp');

/**
  Constructor.
*/
var Task = module.exports = function (config) {
  this.init(config);
};

/**
  Possible task modes.
*/
Task.FILEITERATOR = 'fileIterator';
Task.FILEREADER = 'fileReader';
Task.FILEWRITER = 'fileWriter';

/**
  Default file encoding for reading/writing
*/
Task.defaultEncoding = 'utf8';

/**
  Convenience method for calling constructor.
*/
Task.create = function () {
  // combine all arguments (allows mixins)
  Array.prototype.unshift.call(arguments, {});
  // return task object
  return new Task(_.extend.apply(this, arguments));
};

/**
  Quick access to underlying promise library
*/
Task.when = when;
Task.defer = when.defer;

/**
  Apply configuration when constructing task.

  Task writers should not override this.
*/
Task.prototype.init = function (config) { _.extend(this, config); };

/**
  The task's event emitter.

  Task writers should not override this.
*/
Task.prototype.emitter = new (require('eventemitter2').EventEmitter2)({
  wildcard:true
});

/**
  Convenience method to emit on the task's emitter.

  Task writers should not override this.
*/
Task.prototype.emit = function() {
  this.emitter.emit.apply(this.emitter, arguments);
};

/**
  Handle thrown exception.

  Task writers should not override this.
*/
Task.prototype.exception = function (message, exception) {
  // WHAT DO WE DO HERE?
  //sconsole.log(message, exception);
};

/**
  Read and process a src/dest pair.
  Return an array of modified values or promises.

  Task writers should not override this.
*/
Task.prototype.processFileSet = function (config, input) {
  this.emit('processFileSet', config, input);
  return array(input).map(function (filepath) {
    this._iterateFile(config, filepath);
    // if this task only iterates files, skip out here
    if (this.type === Task.FILEITERATOR) {
      return true;
    }
    var content = this._readFile(config, filepath);
    return this._filterRead(config, content, filepath);
  }, this);
};

/**
  Iterate file groups, processing each.
  Return a promise that resolves when all file sets are complete.

  Task writers should not override this.
*/
Task.prototype.processFiles = function (config) {
  var self = this;
  this.emit('processFiles', config);

  if (!config.files) {
    throw new Error("No files to process.");
  }

  // map all src/dest pairs to a promise
  var complete = Object.keys(config.files).map(function(filepath) {
    // process file set
    var files = self.processFileSet(config, config.files[filepath]);
    // write files if configured to do so
    if (self.type === Task.FILEWRITER) {
      return when.all(files).then(function (content) {
        return self._filterWrite(config, content, filepath);
      }).
      then(function (filteredContent) {
        return self._writeFile(config, filteredContent, filepath);
      });
    } else {
      return true;
    }
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
         then(function() {
           return self._method(config);
         }).
         then(function() {
           return self._teardown(config);
         }, self.exception);
};

/**
  Private methods to invoke task methods with events.
*/
Task.prototype._parseConfig = function(config) {
  this.emit('parseConfig', config);
  return this.parseConfig(config);
};
Task.prototype._setup = function(config) {
  this.emit('setup', config);
  return this.setup(config);
};
Task.prototype._method = function(config) {
  this.emit('method', config);
  return this.method(config);
};
Task.prototype._teardown = function(config) {
  this.emit('teardown', config);
  return this.teardown(config);
};
Task.prototype._iterateFile = function(config, filepath) {
  this.emit('iterateFile', config, filepath);
  return this.iterateFile(config, filepath);
};
Task.prototype._readFile = function(config, filepath) {
  this.emit('readFile', config, filepath);
  return this.readFile(config, filepath);
};
Task.prototype._writeFile = function(config, input, filepath) {
  this.emit('writeFile', config, input, filepath);
  return this.writeFile(config, input, filepath);
};
Task.prototype._filterRead = function(config, input, filepath) {
  this.emit('filterRead', config, input, filepath);
  return this.filterRead(config, input, filepath);
};
Task.prototype._filterWrite = function(config, input, filepath) {
  this.emit('filterWrite', config, input, filepath);
  return this.filterWrite(config, input, filepath);
};

/**
  Parse config to add defaults, etc.

  Task writers may override this.
*/
Task.prototype.parseConfig = function (config) {
  return config;
};

/**
  Use this to run pre-task stuff.
  Can return a promise if needed.

  Task writers may override this.
*/
Task.prototype.setup = function (config) {};

/*
  Task execution goes here.
  Can return a promise if needed.

  Task writers may override this for custom tasks.
**/

Task.prototype.method = function (config) {
  if (this.type === Task.FILEWRITER ||
      this.type === Task.FILEREADER ||
      this.type === Task.FILEITERATOR) {
    return this.processFiles(config);
  } else {
    throw this.exception("No task type or task method defined");
  }
};

/*
  Use this to do something with a file that doesn't involve
  reading its contents directly.  Called each time a file is
  iterated over.

  Task writers may override this.
*/
Task.prototype.iterateFile = function(config, filepath) {};


/**
  Standard file read.

  Task writers can override this for special file handling.
  e.g. things like amazon s3, etc
*/
Task.prototype.readFile = function (config, filepath) {
  var contents;
  var options = {}; // handle options somehow... from where?
  try {
    contents = fs.readFileSync(String(filepath));
    // If encoding is not explicitly null, convert from encoded buffer to a
    // string. If no encoding was specified, use the default.
    if (options.encoding !== null) {
      contents = iconv.decode(contents, options.encoding || this.defaultEncoding);
      // Strip any BOM that might exist.
      if (contents.charCodeAt(0) === 0xFEFF) {
        contents = contents.substring(1);
      }
    }
    return contents;
  } catch(e) {
    throw this.exception('Unable to read "' + filepath + '" file (Error code: ' + e.code + ').', e);
  }
};

/**
  Standard file write.

  Task writers can override this for special file handling.
  e.g. things like amazon s3, etc
*/
Task.prototype.writeFile = function (config, input, filepath) {
  var options = {};

  // Create path, if necessary.
  mkdirp.sync(path.dirname(filepath));
  try {
    // If contents is already a Buffer, don't try to encode it. If no encoding
    // was specified, use the default.
    if (!Buffer.isBuffer(input)) {
      input = iconv.encode(input, options.encoding || this.defaultEncoding);
    }
    fs.writeFileSync(filepath, input);
    return true;
  } catch(e) {
    throw this.exception('Unable to write "' + filepath + '" file (Error code: ' + e.code + ').', e);
  }
};


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