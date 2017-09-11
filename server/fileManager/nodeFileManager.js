var fs = require('co-fs');
var co = require('co');
var fse = require('co-fs-extra');
var origFs = require('fs');
var path = require('path');
var crypto = require('crypto');
var tail = require('../tail');
var mime = require('mime-types');
var NodeFileManager = {};
var tailMap = {};
var tailCount = {};
var platform = require('os').platform();

NodeFileManager.getService = function () {
  var Service;
  if (platform == 'win32') {
    Service = require('./service/windowService');
  } else if (platform == 'linux') {
    Service = require('./service/linuxService');
  } else if (platform == 'darwin') {
    Service = require('./service/linuxService');
  }
  return Service;
}

NodeFileManager.getStats = function* (p) {
  var stats = yield fs.stat(p);
  return {
    folder: stats.isDirectory(),
    size: stats.size,
    mtime: stats.mtime.getTime()
  }
};

NodeFileManager.list = function* (dirPath) {
  try {
    var files = yield fs.readdir(dirPath);
  } catch (err) {
    console.error(err);
  }
  var stats = [];
  for (var i = 0; i < files.length; ++i) {
    var fPath = path.join(dirPath, files[i]);
    //Try to read file, if unable to do it, then move on.
    try {
      if (platform == 'win32') {
        var attr = (require('winattr').getSync(fPath));
        if (attr.system)
          continue;
      }
      var stat = yield NodeFileManager.getStats(fPath);
      stat.name = files[i];
      stat.mime = mime.lookup(stat.name);
      stats.push(stat);
    } catch (err) {
      console.error(err);
    }
  }
  return stats;
};

NodeFileManager.remove = function* (p) {
  yield fse.remove(p);
};

NodeFileManager.unlink = function (p) {
  return origFs.unlink(p);
};

NodeFileManager.mkdirs = function* (dirPath) {
  yield fse.mkdirs(dirPath);
};

NodeFileManager.writeFile = function* (p, content) {
  return fs.writeFile(p, content)
}

NodeFileManager.move = function* (srcs, dest) {
  for (var i = 0; i < srcs.length; ++i) {
    var basename = path.basename(srcs[i]);
    yield fse.move(srcs[i], path.join(dest, basename));
  }
};

NodeFileManager.copy = function* (src, dest) {
  yield fse.copy(src, dest);
};

NodeFileManager.rename = function* (src, dest) {
  yield fse.move(src, dest);
};

NodeFileManager.createReadStream = function () {
  return origFs.createReadStream.apply(origFs, arguments);
}

NodeFileManager.createWriteStream = function () {
  return origFs.createWriteStream.apply(origFs, arguments);
}

NodeFileManager.exists = function (p) {
  return fs.exists(p);
}

NodeFileManager.stream = function (src, query) {
  var filesNamespace = crypto.createHash('md5').update(src).digest('hex');
  global.C.logger.info("Received stream request: " + filesNamespace);
  if (!tailMap[filesNamespace]) {
    global.C.logger.info("Tail channel doesn't exist: " + filesNamespace);
    tailMap[filesNamespace] = tail(src, query);
    tailCount[filesNamespace] = 0;
    var filesSocket = global.C.io.of('/' + filesNamespace).on('connection', function (socket) {
      //Initial emit to new connections
      socket.emit('line', tailMap[filesNamespace].getBuffer().reverse());
      //On disconnect of a connection
      socket.on('disconnect', function () {
        global.C.logger.info("Disconnect request received for channel: " + filesNamespace);
        tailCount[filesNamespace] = tailCount[filesNamespace] - 1;
        tailCount[filesNamespace] = tailCount[filesNamespace] < 0 ? 0 : tailCount[filesNamespace];
        global.C.logger.info("Client count on channel: " + tailCount[filesNamespace]);
        if (tailCount[filesNamespace] == 0 && tailMap[filesNamespace]) {
          global.C.logger.info("Killing the tail channel: " + filesNamespace);
          global.C.io.of('/' + filesNamespace).removeAllListeners();
          tailMap[filesNamespace].removeAllListeners();
          tailMap[filesNamespace].kill();
          tailMap[filesNamespace] = null;
        }
      });
    });
    //Watching over tailer, and emitting events.
    tailMap[filesNamespace].on('line', function (lines) {
      filesSocket.emit('line', lines);
    });
  }
  tailCount[filesNamespace] = tailCount[filesNamespace] + 1;
  global.C.logger.info("Client count on channel: " + tailCount[filesNamespace]);
  return { channel: filesNamespace, path: src };
};

NodeFileManager.partialDownload = function (src, query) {
  query.exec = true;
  return tail(src, query);
}

module.exports = NodeFileManager;
