'use strict';

var EventEmitter = require('events').EventEmitter;
var childProcess = require('child_process');
var util = require('util');
var CBuffer = require('circular-buffer');
var sanitizer = require('validator');
var os = require('os');

var kill = function(tail){
  tail.stdout.removeAllListeners();
  tail.stderr.removeAllListeners();
  tail.removeAllListeners();
  tail.kill('SIGKILL');
}
var Tail = function (path, options) {
  options = options || {buffer: 20};
  options.buffer = isNaN(options.buffer)?20:options.buffer;
  if(options.exec){
    var res={};
    try{
      res.text = childProcess.execSync('tail -n ' + options.buffer + " " + path, {maxBuffer: 5*1024*1024}).toString('utf-8');
    }catch(err){
      res.error = err.code;
    }
    return res;
  }

  EventEmitter.call(this);
  var bufferSize = parseInt(options.buffer);
  this._buffer = new CBuffer(bufferSize);
  var tail;

  if (options.ssh) {
    var args = [
      options.ssh.remoteUser + '@' + options.ssh.remoteHost,
      '-p', options.ssh.remotePort,
      'tail -f'
    ].concat(path);
    tail = childProcess.spawn('ssh', args);
  } else {
    tail = childProcess.spawn('tail', ['-n', options.buffer, '-F'].concat(path));
  }


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
    }).map(function(l){return sanitizer.escape(l)});
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
};
util.inherits(Tail, EventEmitter);

Tail.prototype.getBuffer = function () {
  return this._buffer.toarray();
};

module.exports = function (path, options) {
  return new Tail(path, options);
};