#!/usr/bin/env node

var koa = require('koa');
var cors = require('koa-cors');
var morgan = require('koa-morgan');
var mount = require('koa-mount');
var koaStatic = require('koa-static');
var compress = require('koa-compress');
var Promise = require('promise');
var app = koa();

var path = require('path');
var socketio = require('socket.io');
var tracer = require('tracer');
var crypto = require('crypto');
var co = require('co');
var fs = require('fs');
var utils = require('./utils');
var fsExtra = require('fs-extra');

var serviceOps = ['install', 'uninstall']
var base = __dirname + '/config';

var logPath = __dirname + '/logs';

fsExtra.ensureDirSync(logPath);
fsExtra.ensureDirSync(__dirname + '/tmp');

var stream = require('logrotate-stream');

var accessLogStream = stream({ file: logPath + '/access.log', size: '1m', keep: 5 });
var appLogStream = stream({ file: logPath + '/app.log', size: '1m', keep: 5 });


// Config
var argv = require('yargs')
  .usage('USAGE: scullog [-s <service>] [-p <port>] [-d <directory>] [-c <config>]')
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

var init = function (options) {
  return new Promise(function (resolve, reject) {
    global.C = {
      logger: require('tracer').console({
        transport: function (data) {
          console.log(data.output);
          appLogStream.write(data.output + "\n");
        }
      })
    };
    options = options || {};
    /* function abc(){
      return ["asdf"];
    } */
    co(function* () {
      //console.log(yield abc());

      // resolve multiple promises in parallel
      var res = yield [utils.read(`${base}/default.json`), utils.read(`${base}/main.json`)];
      var conf = Object.assign(res[0], res[1]);
      var remote = yield utils.read(argv.config || options.config || conf.config);
      conf = Object.assign(conf, remote);
      conf.port = argv.port || options.port || conf.port;
      conf.directory = argv.directory || options.directory || conf.directory;
      conf.config = argv.config || options.config || conf.config;
      conf.id = conf.id || "FMAccess-" + new Date().getTime();
      var fileManager = options.fileManager || conf.fileManager;

      global.C.data = {
        root: conf.directory || path.dirname('.')
      };
      global.C.conf = Object.assign({}, {fileManager: fileManager}, conf);
      if(typeof fileManager == 'string'){
        conf.fileManager = fileManager;
      }

      yield utils.write(`${base}/main.json`, conf);

      if (argv.service) {
        var service = require('./selfService');
        if (!service) {
          global.C.logger.info("Not supported platform. Currently, we support only windows, linux and Mac");
          process.exit(0);
        } else if (serviceOps.indexOf(argv.service) != -1 && service[argv.service]) {
          service[argv.service]();
        } else {
          global.C.logger.info('Valid value are install/uninstall/start/stop/restart');
          process.exit(0);
        }
      } else {

        // Start Server
        var Tools = require('./tools');
        var server = null;
        if (conf.ssl && conf.ssl.key && conf.ssl.certificate) {
          server = require('https').createServer({
            key: fs.readFileSync(conf.ssl.key),
            cert: fs.readFileSync(conf.ssl.certificate)
          }, app.callback());
        } else {
          server = require('http').createServer(app.callback());
        }


        var startServer = function (app, port) {
          server.listen(port, "127.0.0.1");
          C.logger.info('listening on *.' + port + " on " + (conf.ssl ? "https" : "http"));
          resolve(port);
        };


        app.proxy = true;
        app.use(compress());
        app.use(morgan.middleware('combined', { stream: accessLogStream }));
        app.use(cors());
        app.use(Tools.handelError);
        app.use(Tools.checkAccessCookie);
        app.use(Tools.realIp);
        var IndexRouter = require('./routes');
        app.use(mount('/', IndexRouter));
        app.use(koaStatic(path.join(__dirname, '../client/')));
        app.use(koaStatic(path.join(__dirname, '../node_modules/')));

        startServer(app, conf.port);

        global.C.io = socketio.listen(server, { log: false });
      }

    });
  });
}

if (require.main === module) {
  init();
} else {
  module.exports = {
    init: init,
    NodeFileManager: require('./fileManager/NodeFileManager')
  };
}







