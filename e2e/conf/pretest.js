var os = require("os");
var fs = require("fs");
var fsExtra = require("fs-extra");
var spawn = require('child_process').spawn;
var conf = require("../protractor.conf").config.params;

var logName = conf.logDir + new Date().getTime() + '.log';

fsExtra.ensureFileSync(logName);
fsExtra.ensureDirSync(conf.downloadDir);

var out = fs.openSync(logName, 'a');
var err = fs.openSync(logName, 'a');

fsExtra.ensureDirSync(conf.baseDir);
console.log(conf.baseDir);
var child = spawn("node", ["--harmony", __dirname + '/../../server/index.js', "-d", conf.baseDir, "-p", "9000"], {
    stdio: [ 'ignore', out, err ],
    detached: true
});

fs.writeFileSync(conf.pidFile, child.pid);
child.unref();
