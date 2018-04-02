var bodyParser = require('koa-bodyparser');
var utils = require('../utils');
var parser = require('co-busboy');
var path = require('path');

var api = function (router, scullog) {
  var FileManager = scullog.getFileManager();
  var Tools = new require('../tools')(scullog);
  /** 
   * To list directory
   * Full/Partial Download file content
   * Stream file content
   */
  router.get('/api/(.*)', Tools.loadRealPath, Tools.checkPathExists, function* () {
    var p = this.request.fPath;
    var type = this.query.type;
    var stats = yield* FileManager.getStats(p);
    if (stats.folder) {
      if (type === 'DOWNLOAD') {
        var tempZipPath = yield FileManager.zipFolder(p);
        var zipStats = yield* FileManager.getStats(tempZipPath);
        this.response.length = zipStats.size;
        this.response.attachment(path.basename(p) + ".zip");
        this.body = yield FileManager.createReadStream(tempZipPath);
        this.res.once('finish', function () {
          FileManager.unlink(tempZipPath);
        });
      } else {
        this.body = yield* FileManager.list(p);
      }
    }
    else {
      if (type === 'PARTIAL_DOWNLOAD') {
        this.response.attachment(new Date().getTime() + "_" + path.basename(p));
        this.body = yield FileManager.partialDownload(p, this.request.query);
      } else if (type === 'STREAM') {
        this.body = FileManager.stream(p, this.request.query);
      } else {
        this.response.length = stats.size;
        this.response.attachment();
        this.body =  yield FileManager.createReadStream(p);
      }
    }
  });


  /**
   * Delete File & Empty folder method
   */
  router.del('/api/(.*)', Tools.loadRealPath, Tools.checkPathExists, function* () {
    var p = this.request.fPath;
    yield* FileManager.remove(p);
    this.body = 'Delete Succeed!';
  });

  /**
   * Move File
   * Rename File
   * Copy File
   * Update File
   */
  router.put('/api/(.*)', Tools.checkBase, Tools.loadRealPath, Tools.checkPathExists, bodyParser(), function* () {
    var type = this.query.type;
    var p = this.request.fPath;
    if (!type) {
      this.status = 400;
      this.body = 'Lack Arg Type'
    }
    else if (type === 'MOVE') {
      var src = this.request.body.src;
      if (!src || !(src instanceof Array)) return this.status = 400;
      var src = src.map(function (s) {
        return FileManager.filePath(s.path, s.base);
      });
      yield* FileManager.move(src, p);
      this.body = 'Move Succeed!';
    }
    else if (type === 'RENAME') {
      var target = this.request.body.target;
      if (!target) return this.status = 400;
      yield* FileManager.rename(p, FileManager.filePath(target.path, target.base));
      this.body = 'Rename Succeed!';
    }
    else if (type === 'COPY') {
      var target = this.request.body.target;
      if (!target) return this.status = 400;
      yield* FileManager.copy(p, FileManager.filePath(target.path, target.base));
      this.body = 'Copy Succeed!';
    }
    else if (type === 'WRITE_FILE') {
      try {
        yield FileManager.writeFile(p, this.request.body.content);
        this.body = 'Edit File Succeed!';
      } catch (err) {
        this.status = 400;
        this.body = 'Edit File Failed!';
      }
    }
    else {
      this.status = 400;
      this.body = 'Arg Type Error!';
    }
  });

  /**
   * Create/Upload File
   * Create Folder
   */
  router.post('/api/(.*)', Tools.loadRealPath, Tools.checkPathNotExists, bodyParser(), function* () {
    var type = this.query.type;
    var p = this.request.fPath;
    if (!type) {
      this.status = 400;
      this.body = 'Lack Arg Type!';
    }
    else if (type === 'CREATE_FOLDER') {
      yield* FileManager.mkdirs(p);
      this.body = 'Create Folder Succeed!';
    }
    else if (type === 'UPLOAD_FILE') {
      yield* FileManager.mkdirs(path.dirname(p));
      var parts = parser(this, {
        autoFields: true
      });
      var part;
      while (part = yield parts) {
        var isFirstChunk = !parts.field._chunkNumber || parts.field._chunkNumber=='0';
        part.pipe(yield FileManager.createWriteStream(p, {flags: isFirstChunk?'w':'a'}))
      } 
      this.body = 'Upload File Succeed!';
    }
    else if (type === 'WRITE_FILE') {
      try {
        yield FileManager.writeFile(p, this.request.body.content);
        this.body = 'Create File Succeed!';
      } catch (err) {
        C.logger.error(err.stack);
        this.status = 400;
        this.body = 'Create File Failed!';
      }
    }
    else {
      this.status = 400;
      this.body = 'Arg Type Error!';
    }
  });
}

module.exports = api;