Task = require('../lib/task')
expect = require('chai').expect

describe 'Task', ->
  fileSet = ['./test/fixtures/foo.txt', './test/fixtures/bar.txt', './test/fixtures/baz.txt']
  config =
    files:
      'tmp/output.txt': fileSet
    options: {}
    flags: {}
  task = null

  describe 'constants', ->
    it 'should have a filter writer constant', ->
      expect(Task.FILEWRITER).to.exist

    it 'should have a file reader constant', ->
      expect(Task.FILEREADER).to.exist

    it 'should have a file iterator constant', ->
      expect(Task.FILEITERATOR).to.exist

    it 'should provide the when module', ->
      expect(Task.when).to.equal(require('when'))

    it 'should provide access to a deferred implementation', ->
      expect(Task.defer).to.equal(require('when').defer)


  describe '::create', ->
    it 'should return a task instance', ->
      expect(Task.create({}).constructor).to.equal Task
    it 'should combine multiple arguments into a single configuration object', ->
      task = Task.create({config:true},{mixin:true})
      expect(task.config).to.be.true
      expect(task.mixin).to.be.true


  describe '#emitter', ->
    it 'should be an eventemitter2 instance', ->
      task = Task.create()
      expect(task.emitter.constructor).to.equal require('eventemitter2').EventEmitter2


  describe '#readFile', ->
    filepath = './test/fixtures/foo.txt'
    beforeEach ->
      task = Task.create()

    describe 'events', ->
      describe 'readFile', ->
        it 'should be emitted before calling #readFile', ->
          emitted = false
          task.emitter.on 'readFile', ->
            emitted = true
          task.readFile(config, filepath)
          expect(emitted).to.be.true

        it 'should emit same arguments as #readFile takes', ->
          args = undefined
          args = null
          task.emitter.on 'readFile', ->
            args = arguments
          task.readFile(config, filepath)
          expect(args).to.deep.equal([config, filepath])

    it 'should read files', ->
      content = task.readFile(config, filepath)
      expect(content).to.equal 'foo'


  describe '#writeFile', ->
    filepath = './tmp/foo.txt'
    input = 'whatever'
    beforeEach ->
      task = Task.create()

    describe 'events', ->
      describe 'writeFile', ->
        it 'should be emitted before calling #writeFile', ->
          emitted = false
          task.emitter.on 'writeFile', ->
            emitted = true
          task.writeFile(config, input, filepath)
          expect(emitted).to.be.true

        it 'should emit same arguments as #writeFile takes', ->
          args = null
          task.emitter.on 'writeFile', ->
            args = arguments
          task.writeFile(config, input, filepath)
          expect(args).to.deep.equal([config, input, filepath])

    it 'should write files', ->
      task.writeFile(config, 'foo', filepath)
      expect(task.readFile(config, filepath)).to.equal('foo')


  describe '#processFileSet', ->
    beforeEach ->
      task = Task.create({})

    describe 'events', ->
      describe 'processFileSet', ->
        it 'should be emitted before processing a file set', ->
          emitted = false
          task.emitter.on 'processFileSet', ->
            emitted = true
          task.processFileSet(config, fileSet)
          expect(emitted).to.be.true

        it 'should emit same arguments as #processFileSet takes', ->
          args = null
          task.emitter.on 'processFileSet', ->
            args = arguments
          task.processFileSet(config, fileSet)
          expect(args).to.deep.equal([config, fileSet])


      describe 'iterateFile', ->
        it 'should be emitted for each file in the set', ->
          called = []
          task.emitter.on 'iterateFile', (config, filepath) ->
            called.push(filepath)
          task.processFileSet(config, fileSet)
          expect(called).to.deep.equal(fileSet)

        it 'should emit same arguments as #iterateFile takes', ->
          args = null
          task.emitter.on 'iterateFile', ->
            args = arguments
          task.processFileSet(config, fileSet)
          expect(args).to.deep.equal([config, fileSet[2]])


      describe 'filterRead', ->
        it 'should be emitted before filtering each file in the set', ->
          called = []
          task.emitter.on 'filterRead', (config, content, filepath) ->
            called.push(content)
          task.processFileSet(config, fileSet)
          expect(called).to.deep.equal(['foo', 'bar', 'baz'])

        it 'should emit same arguments as #filterRead takes', ->
          args = null
          task.emitter.on 'filterRead', ->
            args = arguments
          task.processFileSet(config, fileSet)
          expect(args).to.deep.equal([config, 'baz', fileSet[2]])

    it 'should read an array of files and return an array of values or promises', ->
      result = task.processFileSet({}, fileSet)
      expect(result).to.deep.equal(['foo', 'bar', 'baz'])
      task.filterRead = (config, content, filepath) ->
        defer = undefined
        defer = Task.defer()
        defer.resolve content
        defer
      result = task.processFileSet({}, fileSet)
      expect(Task.when.isPromise(result[0])).to.be.true
      expect(Task.when.isPromise(result[1])).to.be.true
      expect(Task.when.isPromise(result[2])).to.be.true

    it 'should not read file for each item if task is FILEITERATOR type', ->
      task.type = Task.FILEITERATOR
      result = task.processFileSet({}, fileSet)
      expect(result).to.deep.equal [true, true, true]

    it 'should pass file contents through filterRead to allow modification during iteration', ->
      task.filterRead = (config, content, filepath) ->
        'intercepted'
      result = task.processFileSet({}, fileSet)
      expect(result).to.deep.equal ['intercepted', 'intercepted', 'intercepted']


  describe '#processFiles', ->
    beforeEach ->
      task = Task.create({})

    describe 'events', ->
      describe 'processFiles', ->
        it 'should be emitted on execution', ->
          emitted = false
          task.emitter.on 'processFiles', ->
            emitted = true
          task.processFiles(config)
          expect(emitted).to.be.true

    it 'should return a promise that resolves when all file sets are processed', ->
      result = task.processFiles(config)
      expect(Task.when.isPromise(result)).to.be.true

    it 'should pass output through filterWrite to allow modification before writing', ->
      intercepted = null
      task.type = Task.FILEWRITER
      task.filterWrite = (config, content, filepath) ->
        intercepted = content
        'intercepted'
      result = task.processFiles({files:'./tmp/output.txt': ['./test/fixtures/foo.txt']})
      expect(intercepted).to.deep.equal(['foo'])

    it 'should write processed output to file', ->
      task.type = Task.FILEWRITER
      task.processFiles(config)
      expect(task.file.read('./tmp/output.txt')).to.equal('foobarbaz')

    it 'should return a promise that represents the completion of all read/write operations', ->
      task.type = Task.FILEWRITER
      result = task.processFiles(config)
      expect(Task.when.isPromise(result)).to.be.true

  describe '#run', ->
    describe 'events', ->
      describe 'setup', ->
        it 'should be emitted before execution', ->
          called = []
          task.emitter.on 'setup', ->
            called.push('setupEvent')
          task.setup = ->
            called.push('setupMethod')
          task.run({})
          expect(called).to.deep.equal(['setupEvent', 'setupMethod'])

      describe 'teardown', ->
        it 'should be emitted after task method has completed', ->
          called = []
          task.emitter.on 'teardown', ->
            called.push('teardownEvent')
          task.teardown = ->
            called.push('teardownMethod')
          task.run({})
          expect(called).to.deep.equal(['teardownEvent', 'teardownMethod'])

    it 'should call #setup -> #method -> #teardown in order', ->
      called = []
      task.setup = ->
        called.push('setup')
      task.method = ->
        called.push('method')
      task.teardown = ->
        called.push('teardown')
      task.run({})
      expect(called).to.deep.equal(['setup','method','teardown'])