var utils = require('../utils');
var router = require('koa-router')();
var bodyParser = require('koa-bodyparser');
var base = __dirname + "/..";
var fileManager = require("../fileManager");

var favorites;

/**
 * Favorites CRUD Operation
 */
var api = function (router) {
  router.get('/favorite', function* () {
    if (!favorites)
      favorites = yield utils.read(`${base}/config/favorite.json`);
    this.body = favorites;
  });

  router.post('/favorite', bodyParser(), function* () {
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