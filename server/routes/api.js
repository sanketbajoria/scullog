var bodyParser = require('koa-bodyparser');
var fs = require('co-fs');
var origFs = require('fs');
var fse = require('co-fs-extra');
var utils = require('../utils');
var FileManager = require('../fileManager');
var Tools = require('../tools');
var parser = require('co-busboy');
var path = require('path');

var api = function (router) {
  /** 
   * To list directory
   * Full/Partial Download file content
   * Stream file content
   */
  router.get('/api/(.*)', Tools.loadRealPath, Tools.checkPathExists, function* () {
    var p = this.request.fPath;
    var type = this.query.type;
    var stats = yield fs.stat(p);
    if (stats.isDirectory()) {
      if (!type) {
        this.body = yield* FileManager.list(p);
      } else if (type === 'DOWNLOAD') {
        var tempZipPath = yield utils.zipFolder(p);
        this.body = origFs.createReadStream(tempZipPath);
        this.res.once('finish', function () {
          origFs.unlink(tempZipPath);
        });
      } else {
        this.status = 400;
        this.body = 'Cannot stream/download a directory'
      }
    }
    else {
      if (type === 'PARTIAL_DOWNLOAD') {
        var res = FileManager.partialDownload(p, this.request.query);
        if (res.error) {
          this.status = 400;
          this.body = "Bad request! " + res.error;
        } else {
          this.body = res.text;
        }
      } else if (type === 'STREAM') {
        this.body = FileManager.stream(p, this.request.query);
      } else {
        this.body = origFs.createReadStream(p);
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
  router.put('/api/(.*)', Tools.loadRealPath, Tools.checkPathExists, bodyParser(), function* () {
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
        return utils.filePath(s.path, s.base);
      });
      yield* FileManager.move(src, p);
      this.body = 'Move Succeed!';
    }
    else if (type === 'RENAME') {
      var target = this.request.body.target;
      if (!target) return this.status = 400;
      yield* FileManager.rename(p, utils.filePath(target.path, target.base));
      this.body = 'Rename Succeed!';
    }
    else if (type === 'COPY') {
      var target = this.request.body.target;
      if (!target) return this.status = 400;
      yield* FileManager.copy(p, utils.filePath(target.path, target.base));
      this.body = 'Copy Succeed!';
    }
    else if (type === 'WRITE_FILE') {
      try {
        yield fs.writeFile(p, utils.normalizeContent(this.request.body.content));
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
      yield fse.ensureDir(path.dirname(p));
      var parts = parser(this, {
        autoFields: true
      });
      var part;
      while (part = yield parts) {
        var isFirstChunk = !parts.field._chunkNumber || parts.field._chunkNumber=='0';
        part.pipe(origFs.createWriteStream(p, {flags: isFirstChunk?'w':'a'}))
      } 
      this.body = 'Upload File Succeed!';
    }
    else if (type === 'WRITE_FILE') {
      try {
        yield fs.writeFile(p, utils.normalizeContent(this.request.body.content));
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