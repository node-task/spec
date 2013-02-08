fs = require('fs')
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
    it 'should have a file writer type', ->
      expect(Task.FILEWRITER).to.exist

    it 'should have a file reader type', ->
      expect(Task.FILEREADER).to.exist

    it 'should have a file iterator type', ->
      expect(Task.FILEITERATOR).to.exist

    it 'should provide the when module', ->
      expect(Task.when).to.equal(require('when'))

    it 'should provide easy access to when\'s deferred implementation', ->
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


  describe '#processFileSet', ->
    beforeEach ->
      task = Task.create({})

    describe 'event', ->
      describe 'processFileSet', ->
        it 'should be emitted', ->
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
        it 'should be emitted for each file in set', ->
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
        it 'should be emitted for each file in set', ->
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

    it 'should pass file contents through filterRead during iteration', ->
      task.filterRead = (config, content, filepath) ->
        'intercepted'
      result = task.processFileSet({}, fileSet)
      expect(result).to.deep.equal ['intercepted', 'intercepted', 'intercepted']


  describe '#processFiles', ->
    beforeEach ->
      task = Task.create({})

    describe 'event', ->
      describe 'processFiles', ->
        it 'should be emitted', ->
          emitted = false
          task.emitter.on 'processFiles', ->
            emitted = true
          task.processFiles(config)
          expect(emitted).to.be.true

    it 'should return a promise that resolves when all file sets are processed', ->
      result = task.processFiles(config)
      expect(Task.when.isPromise(result)).to.be.true

    it 'should pass output through filterWrite before writing', ->
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
      expect(fs.readFileSync('./tmp/output.txt','utf8')).to.equal('foobarbaz')

    it 'should return a promise that represents the completion of all read/write operations', ->
      task.type = Task.FILEWRITER
      result = task.processFiles(config)
      expect(Task.when.isPromise(result)).to.be.true

    it 'should not be called unless task type is \'filewriter\'', ->
      task.type = Task.FILEREADER
      called = false;
      task.writeFile = ->
        called = true;
      task.processFiles(config)
      expect(called).to.be.false

  describe '#run', ->
    beforeEach ->
      task = Task.create({})

    describe 'event', ->
      describe 'setup', ->
        it 'should be emitted', ->
          called = false
          task.emitter.on 'setup', ->
            called = true
          task.run({})
          expect(called).to.be.true

      describe 'method', ->
        it 'should be emitted', ->
          called = false
          task.emitter.on 'method', ->
            called = true
          task.run({})
          expect(called).to.be.true

      describe 'teardown', ->
        it 'should be emitted', ->
          called = false
          task.emitter.on 'teardown', ->
            called = true
          task.method = ->
          task.run({})
          expect(called).to.be.true

    it 'should call #setup -> #method -> #teardown in correct order', (done) ->
      callOrder = []
      task.setup = ->
        defer = Task.defer()
        setTimeout ->
          callOrder.push('setup')
          defer.resolve(true)
        , 10
        defer
      task.method = ->
        defer = Task.defer()
        setTimeout ->
          callOrder.push('method')
          defer.resolve(true)
        , 10
        defer
      task.teardown = ->
        defer = Task.defer()
        setTimeout ->
          callOrder.push('teardown')
          defer.resolve(true)
        , 100
        defer
      Task.when(task.run({})).then ->
        expect(callOrder).to.deep.equal(['setup', 'method', 'teardown'])
        done()

    it 'should throw if no task type or method is defined', ->

      expect(->(task.run({}))()).to.throw(Error)
