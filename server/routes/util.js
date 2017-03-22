var bodyParser = require('koa-bodyparser');
var fs = require('co-fs');
var utils = require('../utils');
var grep = require('../cmd/grep');
var jwt = require('jsonwebtoken');

var api = function (router) {
  /**
   * Get Current Base Directory
   */
  router.get('/base', function* () {
    this.body = global.C.data.root;
  });

  /**
   * Get access permission
   */
  router.get('/access', function () {
    var role = "default";
    var expiresIn = this.request.query.t;
    var accessJwt;
    if (expiresIn) {
      role = "elevated";
      accessJwt = jwt.sign({ role: role }, global.C.conf.secret, { expiresIn: expiresIn });
      this.cookies.set(global.C.conf.id, accessJwt, { httpOnly: true })
    } else {
      accessJwt = this.cookies.get(global.C.conf.id);
      if (accessJwt) {
        try {
          role = jwt.verify(accessJwt, global.C.conf.secret).role;
        } catch (e) {
          this.cookies.set(global.C.conf.id, '', { httpOnly: true, expires: new Date(1) })
        }
      }
    }
    this.body = { permissions: utils.getPermissions(role), role: role };
  });

  /**
   * Search text over a path
   * {pattern: "", folder: "", recursive: "", fileMask: "", regex: "extended", ignoreCase: true/false, wholeWord: ""} 
   */
  router.post('/find', bodyParser(), function* () {
    var criteria = this.request.body.criteria;
    var folderPath = utils.filePath(criteria.folder, this.request.query.base);
    if (criteria.pattern && (yield fs.exists(folderPath))) {
      criteria.folder = folderPath;
      try {
        this.body = yield grep.exec(criteria);
      } catch (e) {
        this.status = 400;
        this.body = JSON.stringify(e);
      }
    } else {
      this.status = 400;
      this.body = 'Invalid Parameter list - ' + JSON.stringify(criteria);
    }
  });
}

module.exports = api;