'use strict';

var custom = require('../tasks/custom');

exports.custom = {

  default_options: function(test) {
    test.expect(1);
    custom.run({
      files: [
        'test/fixtures/test.js'
      ]
    });
    test.ok(true, 'is okay');
    test.done();
  },

};
