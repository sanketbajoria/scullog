var utils = require('../utils');
var router = require('koa-router')();
var bodyParser = require('koa-bodyparser');


/**
 * Favorites CRUD Operation
 */
var api = function (router, scullog) {
  var favorites;
  var fileManager = scullog.getFileManager();
  var Tools = new require('../tools')(scullog);
  
  var base = `${__dirname}/../${scullog.getConfiguration().id}`;
  
  router.get('/favorite', function* () {
    if (!favorites)
      favorites = yield utils.read(`${base}/config/favorite.json`);
    this.body = favorites;
  });

  router.post('/favorite', Tools.checkBase, bodyParser(), function* () {
    fileManager.filePath(this.request.body.path, this.request.query.base);
    favorites[this.request.query.base] = favorites[this.request.query.base] || {};
    favorites[this.request.query.base][this.request.body.path] = this.request.body.name;
    yield utils.write(`${base}/config/favorite.json`, this.body = favorites);
  });

  router.delete('/favorite', function* () {
    var p = this.request.query.path;
    if (favorites[this.request.query.base] && p in favorites[this.request.query.base]) {
      delete favorites[this.request.query.base][p];
      yield utils.write(`${base}/config/favorite.json`, this.body = favorites);
    } else {
      this.body = "Bad argument type";
      this.status = 400;
    }
  });
}

module.exports = api;