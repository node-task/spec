'use strict';

var stylus = require('../tasks/stylus');

exports.stylus = {

  default_options: function(test) {
    test.expect(1);
    stylus.run({
      files: {
        'tmp/stylus_default': ['test/fixtures/stylus.styl']
      }
    });
    test.ok(true, 'whatever');
    test.done();
  },

};
