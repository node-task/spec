'use strict';

var jshint = require('../tasks/jshint');

exports.jshint = {

  default_options: function(test) {
    test.expect(1);
    jshint.run({
      files: [
        'test/fixtures/test.js'
      ]
    });
    test.ok(true, 'is okay');
    test.done();
  },

};
