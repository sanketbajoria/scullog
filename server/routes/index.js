var koaRouter = require('koa-router');
var path = require('path');
var views = require('co-views');

var render = views(path.join(__dirname, '../../client'), {map: {html: 'ejs'}});

module.exports = function(scullog){
  var router = new koaRouter();
  
  router.get('/', function *() {
    this.body = yield render('index');
  });
  
  require('./api')(router, scullog);
  require('./favorites')(router, scullog);
  require('./service')(router, scullog);
  require('./system')(router, scullog);
  require('./util')(router, scullog);
  
  return router.middleware();
}