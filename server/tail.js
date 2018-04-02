'use strict';

var EventEmitter = require('events').EventEmitter;

var util = require('util');
var CBuffer = require('circular-buffer');
var os = require('os');

var kill = function(tail){
  tail.emit('close');
  tail.stdout.removeAllListeners();
  tail.stderr.removeAllListeners();
  tail.removeAllListeners();
  if(tail.kill)
    tail.kill('SIGKILL');
}
var Tail = function (path, options, fileManager) {
  options = options || {buffer: 20};
  options.buffer = isNaN(options.buffer)?20:options.buffer;
  if(options.exec){
    return fileManager.execCmd('tail -n ' + options.buffer + " " + path, {maxBuffer: 10*1024*1024});
  }

  EventEmitter.call(this);
  var bufferSize = parseInt(options.buffer);
  this._buffer = new CBuffer(bufferSize);

  fileManager.spawnCmd('tail', ['-n', options.buffer, '-F'].concat(path)).then((tail) => {
    tail.stderr.on('data', function (data) {
      // If there is any important error then display it in the console. Tail will keep running.
      // File can be truncated over network.
      if (data.toString().indexOf('file truncated') === -1) {
        console.error(data.toString());
      }
    });
  
    tail.stdout.on('data', function (data) {
      var lines = data.toString('utf-8').split(os.EOL);
      lines = lines.filter(function(l){
        return !!l;
      }).map(function(l){return l;});
      lines.forEach(function (line) {
        this._buffer.enq(line);
      }.bind(this));
      this.emit('line', lines);
    }.bind(this));
  
    this.kill = function(){
      kill(tail);
    }

    process.on('exit', function () {
      kill(tail);
    });

  });
};

util.inherits(Tail, EventEmitter);

Tail.prototype.getBuffer = function () {
  return this._buffer.toarray();
};

module.exports = function (path, options, fileManager) {
  return new Tail(path, options, fileManager);
};