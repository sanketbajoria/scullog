#!/usr/bin/env node

var koa =require('koa');
var app = koa();
var server = require('http').createServer(app.callback());
var path = require('path');
var socketio = require('socket.io');
var tail = require('./tail');
var tracer = require('tracer');
var mount = require('koa-mount');
var koaStatic = require('koa-static');
var crypto = require('crypto');
var co = require('co');
var fs = require('co-fs');
var utils = require('./utils');
var cors = require('koa-cors');

var serviceOps = ['install','uninstall','start','stop','restart']
var base = __dirname + '/config';



// Config
var argv = require('yargs')
    .usage('USAGE: scullog [-s <service>] [-p <port>] [-d <directory>] [-P <prefix>] [-c <config>]')
    .options({
        's': {
          alias: 'service',
          describe: 'install/uninstall as service',
          choices: serviceOps
        },
        'p': {
          alias: 'port',
          describe: 'Server Port',
          type: 'number'
        },
        'd': {
          alias: 'directory',
          describe: 'Root Files Directory',
          type: 'array'
        },
        'P': {
          alias: 'prefix',
          describe: 'URL prefix',
          type: 'string'
        },
        'c': {
          alias: 'config',
          describe: 'Local/Remote Config file'
        }
    })
    .showHelpOnFail(true, 'Specify --help for available options')
    .help('h')
    .alias('h', 'help')
    .version()
    .alias('v', 'version')
    .argv;

co(function *(){
  // resolve multiple promises in parallel
  var res = yield [utils.read(`${base}/default.json`), utils.read(`${base}/main.json`)];
  var conf = Object.assign(res[0],res[1]);
  var remote = yield utils.read(argv.config || conf.config);
  conf = Object.assign(conf, remote);
  conf.port = argv.port || conf.port;
  conf.directory = argv.directory || conf.directory;
  conf.prefix = argv.prefix || conf.prefix;
  conf.config = argv.config || conf.config;
  conf.id = conf.id || "FMAccess-"+new Date().getTime();

  global.C = {
    data: {
      root: conf.directory || path.dirname('.')
    },
    logger: require('tracer').console({level: 'info'})
  };
  global.C.conf = conf;
  yield utils.write(`${base}/main.json`, conf);

  if(argv.service){
    var service = require('./selfService');
    if(!service){
      console.log("Not supported platform. Currently, we support only windows, linux and Mac");
      process.exit(0);
    }else if(serviceOps.indexOf(argv.service)!=-1 && service[argv.service]){
      service[argv.service]();
    }else{
      console.log('Valid value are install/uninstall/start/stop/restart');
      process.exit(0);
    }
  }else{

    // Start Server
    var Tools = require('./tools');

    var startServer = function (app, port) {
      server.listen(port);
      C.logger.info('listening on *.' + port);
    };


    app.proxy = true;
    app.use(cors());
    app.use(Tools.handelError);
    app.use(Tools.checkAccessCookie);
    app.use(Tools.realIp);
    var IndexRouter = require('./routes');
    app.use(mount('/', IndexRouter));
    app.use(mount(conf.prefix, koaStatic(path.join(__dirname,'../client/'))));
    app.use(mount(conf.prefix, koaStatic(path.join(__dirname,'../node_modules/'))));

    startServer(app, + conf.port);

    global.C.io = socketio.listen(server, {path: conf.prefix + 'socket.io', log: false});
  }

});









