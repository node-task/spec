'use strict';

var stylus = require('../tasks/stylus');

exports.stylus = {

  default_options: function(test) {
    test.expect(1);
    stylus.run({
      files: {
        'tmp/stylus_default': ['test/fixtures/stylus.css']
      }
    });
    test.ok(true, 'whatever');
    test.done();
  },

};
