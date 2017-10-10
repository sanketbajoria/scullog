var fs = require('co-fs');
var co = require('co');
var fse = require('co-fs-extra');
var origFs = require('fs');
var path = require('path');
var crypto = require('crypto');
var tail = require('../tail');
var mime = require('mime-types');
var Promise = require('promise');
var tailMap = {};
var tailCount = {};
var platform = require('os').platform();
const util = require('util');
var childProcess = require('child_process');
var zip = require('node-zip-dir');

class NodeFileManager {

  filePath(relPath, base) {
    if (relPath.indexOf('..') >= 0) {
      var e = new Error('Do Not Contain .. in relPath!');
      e.status = 400;
      throw e;
    } else if (!!!base || global.C.data.root.indexOf(base) == -1) {
      var e = new Error('Invalid base location');
      e.status = 400;
      throw e;
    } else {
      return path.join(base, relPath);
    }
  }


  getService() {
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

  * getStats(p) {
    var stats = yield fs.stat(p);
    return {
      folder: stats.isDirectory(),
      size: stats.size,
      mtime: stats.mtime.getTime()
    }
  };

  * list(dirPath) {
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
        var stat = yield this.getStats(fPath);
        stat.name = files[i];
        stat.mime = mime.lookup(stat.name);
        stats.push(stat);
      } catch (err) {
        console.error(err);
      }
    }
    return stats;
  };

  * remove(p) {
    yield fse.remove(p);
  };

  unlink(p) {
    return origFs.unlink(p);
  };

  * mkdirs(dirPath) {
    yield fse.mkdirs(dirPath);
  };

  * writeFile(p, content) {
    return yield fs.writeFile(p, content)
  }

  * move(srcs, dest) {
    for (var i = 0; i < srcs.length; ++i) {
      var basename = path.basename(srcs[i]);
      yield fse.move(srcs[i], path.join(dest, basename));
    }
  };

  *copy(src, dest) {
    yield fse.copy(src, dest);
  };

  * rename(src, dest) {
    yield fse.move(src, dest);
  };

  createReadStream() {
    var params = arguments;
    return new Promise((resolve, reject) => {
      resolve(origFs.createReadStream.apply(origFs, params))
    });
  }

  createWriteStream() {
    var params = arguments;
    return new Promise((resolve, reject) => {
      resolve(origFs.createWriteStream.apply(origFs, params));
    });
  }

  exists(p) {
    return fs.exists(p);
  }

  stream(src, query) {
    var filesNamespace = crypto.createHash('md5').update(src).digest('hex');
    global.C.logger.info("Received stream request: " + filesNamespace);
    if (!tailMap[filesNamespace]) {
      global.C.logger.info("Tail channel doesn't exist: " + filesNamespace);
      tailMap[filesNamespace] = tail(src, query, this);
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

  partialDownload(src, query) {
    query.exec = true;
    return tail(src, query, this);
  }

  execCmd() {
    var params = arguments;
    return new Promise((resolve, reject) => {
      resolve(childProcess.execSync.apply(childProcess, params));
    });
  }

  spawnCmd() {
    var params = arguments;
    return new Promise((resolve, reject) => {
      resolve(childProcess.spawn.apply(childProcess, params));
    });
  }

  zipFolder(p) {
    var tempZipPath = __dirname + '/../tmp/' + path.basename(p) + ".zip";
    return zip.zip(p, tempZipPath);
  }
}

module.exports = NodeFileManager;
