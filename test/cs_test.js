'use strict';

var cs = require('../tasks/cs');

exports.cs = {

  default_options: function(test) {
    test.expect(1);
    cs.run({
      files: {
        'tmp/test.js': ['test/fixtures/test.coffee']
      }
    });
    test.ok(true, 'is okay');
    test.done();
  },

};
