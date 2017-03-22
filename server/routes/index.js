var koaRouter = require('koa-router');
var path = require('path');
var views = require('co-views');
var router = new koaRouter();
var render = views(path.join(__dirname, '../../client'), {map: {html: 'ejs'}});

router.get('/', function *() {
  this.body = yield render('index');
});

require('./api')(router);
require('./favorites')(router);
require('./service')(router);
require('./system')(router);
require('./util')(router);

module.exports = router.middleware();