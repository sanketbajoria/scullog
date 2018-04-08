var timers = require('timers');
var spawn = require('cross-spawn');
var utils = require('../utils');
var childProcess = require('child_process');
var origFs = require('fs');
var base = __dirname + "/../..";

/**
 * Restart server
 */
var restart = function () {
  timers.setTimeout(function () {
    try {
      origFs.chmodSync(`${base}/bin/scullog`, '0777');
      var child = spawn(`${base}/bin/scullog`, ['-s', 'restart'], { detached: true });
    } catch (err) {
      global.C.logger.info("Error, occured, while restarting service: ", err);
    }
  }, 1000);
}

var api = function (router, scullog) {
  router.get('/updateFM', function* () {
    global.C.logger.info("Updating server");
    var remote = yield utils.read(scullog.getConfiguration().remoteJSON);
    var local = yield utils.read(`${base}/package.json`);
    var c = utils.versionCompare(remote['version'], local['version']);
    if (c === false) {
      this.status = 400;
      this.body = "Invalid configuration for remote JSON path";
    } else if (c < 1 && !this.request.query.forceUpgrade) {
      this.body = c == 0 ? 'Already up to date' : `Lower version ${remote['version']} for remote`;
    }
    if (!!!this.body) {
      try {
        yield utils.extractRemoteZip(scullog.getConfiguration().remoteLocation, `${base}`);
      } catch (err) {
        C.logger.error(err.stack);
        this.status = 400;
        this.body = `Update Failed from ${local['version']} to ${remote['version']}`;
      }
      childProcess.execSync(`cd ${base} && npm install`);
      restart();
      this.body = `Update Successful from ${local['version']} to ${remote['version']}`;
    }
  });

  router.get('/restartFM', function () {
    global.C.logger.info("Restarting server");
    restart();
    this.body = "Restart Successful";
  });

  router.get('/version', function* () {
    var local = yield utils.read(`${base}/package.json`);
    this.body = local["version"];
  });

}

module.exports = api;