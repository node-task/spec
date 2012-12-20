'use strict';

var concat = require('../tasks/concat');
var grunt = require('grunt');

exports.concat = {

  default_options: function(test) {
    test.expect(1);
    concat.run({
      files: {
        'tmp/default_options': ['test/fixtures/file1', 'test/fixtures/file2']
      }
    });
    test.ok(true, 'whatever');
    test.done();
  },

  custom_options: function(test) {
    test.expect(1);
    concat.run({
      options: {
        separator: ': '
      },
      files: {
        'tmp/custom_options': ['test/fixtures/file1', 'test/fixtures/file2']
      }
    });
    test.ok(true, 'whatever');
    test.done();
  },

  stripbanner: function(test) {
    test.expect(7);

    var src = grunt.file.read('test/fixtures/banner.js');
    test.equal(concat.stripBanner(src), '// Comment\n\n/* Comment */\n', 'It should strip the top banner.');
    test.equal(concat.stripBanner(src, {block: true}), '// Comment\n\n/* Comment */\n', 'It should strip the top banner.');

    src = grunt.file.read('test/fixtures/banner2.js');
    test.equal(concat.stripBanner(src), '\n/*! SAMPLE\n * BANNER */\n\n// Comment\n\n/* Comment */\n', 'It should not strip the top banner.');
    test.equal(concat.stripBanner(src, {block: true}), '// Comment\n\n/* Comment */\n', 'It should strip the top banner.');

    src = grunt.file.read('test/fixtures/banner3.js');
    test.equal(concat.stripBanner(src), '\n// This is\n// A sample\n// Banner\n\n// But this is not\n\n/* And neither\n * is this\n */\n', 'It should not strip the top banner.');
    test.equal(concat.stripBanner(src, {block: true}), '\n// This is\n// A sample\n// Banner\n\n// But this is not\n\n/* And neither\n * is this\n */\n', 'It should not strip the top banner.');
    test.equal(concat.stripBanner(src, {line: true}), '// But this is not\n\n/* And neither\n * is this\n */\n', 'It should strip the top banner.');
    test.done();
  }

};
