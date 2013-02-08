/*
 * node-task
 * http://github.com/tkellen/node-task
 *
 * Copyright (c) 2012 Tyler Kellen, contributors
 * Licensed under the MIT license.
 */

'use strict';

module.exports = function(grunt) {

  grunt.initConfig({
    jshint: {
      all: [
        'Gruntfile.js',
        'lib/*.js'
      ],
      options: {
        jshintrc: '.jshintrc'
      }
    },
    clean: {
      tmp: ['tmp']
    },
    watch: {
      files: [
        '**/*.js',
        'test/*.js'
      ],
      tasks: ['test']
    }
  });

  grunt.registerTask('mocha', function () {
    var done = this.async();
    grunt.util.spawn({
      cmd: './node_modules/.bin/mocha',
      args: ['--compilers','coffee:coffee-script']
    }, function (err, result) {
      if (err) {
        grunt.verbose.error();
        done(err);
        return;
      }
      grunt.log.writeln(result.stdout);
      done();
    });
  });
  grunt.loadNpmTasks('grunt-contrib-jshint');
  grunt.loadNpmTasks('grunt-contrib-clean');
  grunt.loadNpmTasks('grunt-contrib-watch');
  grunt.registerTask('test', ['clean', 'jshint', 'mocha']);

  // By default, lint and run all tests.
  grunt.registerTask('default', ['test']);

};
