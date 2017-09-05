var fs = require('co-fs');
var jwt = require('jsonwebtoken');
var FilePath = require('./utils').filePath;

module.exports = {
  realIp: function * (next) {
      this.req.ip = this.headers['x-forwarded-for'] || this.ip;
      yield *next;
  },

  handelError: function * (next) {
    try {
      yield * next;
    } catch (err) {
      this.status = err.status || 500;
      this.body = err.message;
      C.logger.error(err.stack);
      this.app.emit('error', err, this);
    }
  },

  loadRealPath: function *(next) {
    // router url format must be /api/(.*)
    this.request.fPath = FilePath(this.params[0], this.request.query.base);
    C.logger.info(this.request.fPath);
    yield * next;
  },

  checkPathExists: function *(next) {
    // Must after loadRealPath
    if (!(yield fs.exists(this.request.fPath))) {
      this.status = 404;
      this.body = 'Path Not Exists!';
    }
    else {
      yield * next;
    }
  },

  checkPathNotExists: function *(next) {
    // Must after loadRealPath
    if (this.query.type != 'UPLOAD_FILE' && (yield fs.exists(this.request.fPath))) {
      this.status = 400;
      this.body = 'Path Has Exists!';
    }
    else {
      yield * next;
    }
  },

  checkAccessCookie: function *(next) {
    if(this.request.url.indexOf('/access') == -1){
      var accessJwt = this.cookies.get(global.C.conf.id);
      if(accessJwt){
        try{
          var decoded = jwt.verify(accessJwt, global.C.conf.secret);
        }catch(e){
          this.append('access-expired', 'true');
        }
      }else if(this.request.header["access-role"]!="default"){
        this.append('access-expired', 'true');
      }
    }
    yield * next;
  }

};
