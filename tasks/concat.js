/*
 * task
 * http://gruntjs.com/
 *
 * Copyright (c) 2012 Tyler Kellen, contributors
 * Licensed under the MIT license.
 */
'use strict';

var Task = require('../lib/task');
var _ = require('lodash');

var task = {};

task.name = 'concat';
task.description = 'Concatenate files.';
task.type = Task.FILEWRITER;

// Return the given source cude with any leading banner comment stripped.
task.stripBanner = function(src, options) {
  if (!options) { options = {}; }
  var m = [];
  if (options.line) {
    // Strip // ... leading banners.
    m.push('(?:.*\\/\\/.*\\n)*\\s*');
  }
  if (options.block) {
    // Strips all /* ... */ block comment banners.
    m.push('\\/\\*[\\s\\S]*?\\*\\/');
  } else {
    // Strips only /* ... */ block comment banners, excluding /*! ... */.
    m.push('\\/\\*[^!][\\s\\S]*?\\*\\/');
  }
  var re = new RegExp('^\\s*(?:' + m.join('|') + ')\\s*', '');
  return src.replace(re, '');
};

task.parseConfig = function (config) {
  config.options = _.extend({
     separator: '\n',
     banner: '',
     stripBanners: false,
     process: false
  }, config.options);
  if (config.options.stripBanners === true) {
    config.options.stripBanners = {};
  }
  if (config.options.process === true) {
    config.options.process = {};
  }
  return config;
};

task.filterWrite = function(config, input, filepath) {
  var options = config.options;
  if (options.stripBanners) {
    input = input.map(function(src) {
      return this.stripBanner(src, options.stripBanners);
    });
  }
  return input.join(options.separator);
};

task = module.exports = Task.create(task);
