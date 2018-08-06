#!/usr/bin/env node

var koa = require('koa');
var cors = require('koa-cors');
var morgan = require('koa-morgan');
var mount = require('koa-mount');
var koaStatic = require('koa-static');
var compress = require('koa-compress');

var path = require('path');
var socketio = require('socket.io');
var tracer = require('tracer');
var crypto = require('crypto');
var co = require('co');
var fs = require('fs');
var stream = require('logrotate-stream');

var utils = require('./utils');
var fsExtra = require('fs-extra');
var Routes = require('./routes');
var Tools = require('./tools');
var service = require('./selfService');
var NodeFileManager = require('./fileManager/NodeFileManager');
var LinuxService = require('./fileManager/service/linuxService');

var serviceOps = ['install', 'uninstall', 'start', 'stop', 'restart'];

// Command line configuration
var argv = require('yargs')
  .usage('USAGE: scullog [-s <service>] [-p <port>] [-d <directory>] [-c <config>]')
  .options({
    's': {
      alias: 'service',
      describe: 'install/uninstall/start/stop/restart as service',
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
    },
    'h': {
      alias: 'host',
      describe: 'IP Address to bind to'
    }
  })
  .showHelpOnFail(true, 'Specify --help for available options')
  .help('h')
  .alias('h', 'help')
  .version()
  .alias('v', 'version')
  .argv;


/**
 * Scullog Server
 */
class Scullog {
  constructor(options) {
    options = options || {};
    options.base = options.base || __dirname;
    this.paths = {};
    this.paths.config = `${options.base}/config`;
    this.paths.log = `${options.base}/logs`;
    this.paths.temp = `${options.base}/tmp`;

    fsExtra.ensureDirSync(this.paths.temp);
    fsExtra.ensureDirSync(this.paths.log);

    this.__$init = new Promise((resolve, reject) => {
      var self = this;
      this.__initLogger();
      co(function* () {
        var id = options.id, res, conf, remote;

        if (!id) {
          if (argv.service || options.service) {
            id = 'scullog-service'
          } else {
            id = "scullog-default";
          }
        }

        fsExtra.ensureDirSync(`${self.paths.config}/${id}`);
        //Read configuration
        res = yield [utils.read(`${self.paths.config}/default.json`), utils.read(`${self.paths.config}/${id}/main.json`)];
        conf = Object.assign(res[0], res[1]);

        //Override configuration with remote configuration file
        remote = yield utils.read(argv.config || options.config || conf.config);
        conf = Object.assign(conf, remote);

        //Override configuration with command line arguments or options arguments
        conf.port = argv.port || options.port || conf.port;
        conf.host = argv.host || options.host || conf.host;
        conf.directory = argv.directory || options.directory || conf.directory || [path.dirname('.')];
        conf.config = argv.config || options.config || conf.config;
        conf.id = id;

        //Initializing fileManager Configuration
        var fileManager = options.fileManager || conf.fileManager;
        if (typeof fileManager == 'string') {
          conf.fileManager = fileManager;
        }

        //Writing back the main configuration, to persist across restart
        yield utils.write(`${self.paths.config}/${id}/main.json`, conf);


        self.conf = Object.assign(conf)
        if (fileManager) {
          if (typeof fileManager == 'string') {
            self.fileManager = require(fileManager)();
          } else {
            self.fileManager = fileManager;
          }
        } else {
          self.fileManager = new NodeFileManager(self);
        }

        if (argv.service) {
          self.__initService();
        } else {
          self.__initServer(resolve);
        }
      });
    });
  }

  /**
   * Initialize as Service
   */
  __initService() {
    if (!service) {
      global.C.logger.info("Not supported platform. Currently, we support only windows, linux and Mac");
      process.exit(0);
    } else if (serviceOps.indexOf(argv.service) != -1 && service[argv.service]) {
      service[argv.service]();
    } else {
      global.C.logger.info('Valid value are install/uninstall/start/stop/restart');
      process.exit(0);
    }
  }

  /**
   * Initialize as Server
   */
  __initServer(resolve) {
    // Start Server
    var app = koa();
    var tools = new Tools(this);
    this.server = null;
    if (this.conf.ssl && this.conf.ssl.key && this.conf.ssl.certificate) {
      this.server = require('https').createServer({
        key: fs.readFileSync(this.conf.ssl.key),
        cert: fs.readFileSync(this.conf.ssl.certificate)
      }, app.callback());
    } else {
      this.server = require('http').createServer(app.callback());
    }

    var accessLogStream = stream({ file: this.paths.log + '/access.log', size: '1m', keep: 5 });

    app.proxy = true;
    app.use(compress());
    app.use(morgan.middleware('combined', { stream: accessLogStream }));
    app.use(cors());
    app.use(tools.handelError);
    app.use(tools.checkAccessCookie);
    app.use(tools.realIp);
    app.use(mount('/', new Routes(this)));
    app.use(koaStatic(path.join(__dirname, '../dist/')));
    app.use(koaStatic(path.join(__dirname, '../client/')));
    app.use(koaStatic(path.join(__dirname, '../node_modules/')));

    this.server.listen({port: this.conf.port, host: this.conf.host}, () => {
      this.conf.port = this.server.address().port;
      global.C.logger.info('listening on *.' + this.conf.port + " on " + (this.conf.ssl ? "https" : "http"));
      resolve(this.conf.port);
    }).on('error', (e) => {
      global.C.logger.error("Error occured - " + e);
    });

    this.io = socketio.listen(this.server, { log: false });
  }

  /**
   * Initialize a global logger
   */
  __initLogger() {
    var appLogStream = stream({ file: this.paths.log + '/app.log', size: '1m', keep: 5 });
    global.C = {
      logger: require('tracer').console({
        transport: function (data) {
          console.log(data.output);
          appLogStream.write(data.output + "\n");
        }
      })
    }
  }

  initialized() {
    return this.__$init;
  }

  getConfiguration() {
    return this.conf;
  }

  getSocketServer() {
    return this.io;
  }

  getFileManager() {
    return this.fileManager;
  }

  exitHandler(options, err) {
    if (err) {
      C.logger.error(`Error occured ${this.conf.id} -- ${err.stack}`);
    }
    if (options.cleanup) {
      C.logger.info(`Cleanup ${this.conf.id}`);
      fsExtra.removeSync(`${this.paths.config}/${this.conf.id}`)
    }
    if (options.exit) {
      C.logger.info(`Exit called ${this.conf.id}`);
      process.exit();
    }
  }

  close(){
    this.io.close();
    this.server.close();
  }

}

/**
 * Expose NodeFileManager for extending n reusing purpose
 */
Scullog.NodeFileManager = NodeFileManager;

Scullog.LinuxService = LinuxService;



//Main execution point
if (require.main === module) {

  let scullog = new Scullog();

  if (!argv.service) {
    scullog.initialized().then(function () {
      process.stdin.resume();//so the program will not close instantly
      //do something when app is closing
      process.on('exit', scullog.exitHandler.bind(scullog, { cleanup: true }));

      //catches ctrl+c event
      process.on('SIGINT', scullog.exitHandler.bind(scullog, { exit: true }));
      process.on('SIGHUP', scullog.exitHandler.bind(scullog, { exit: true }));
      process.on('SIGQUIT', scullog.exitHandler.bind(scullog, { exit: true }));
      process.on('SIGTERM', scullog.exitHandler.bind(scullog, { exit: true }));

      // catches "kill pid" (for example: nodemon restart)  
      process.on('SIGUSR1', scullog.exitHandler.bind(scullog, { exit: true }));
      process.on('SIGUSR2', scullog.exitHandler.bind(scullog, { exit: true }));

      //catches uncaught exceptions
      process.on('uncaughtException', scullog.exitHandler.bind(scullog, { exit: true }));
    })
  }
} else {
  module.exports = Scullog;
}







