var os = require("os");
var fs = require("fs");
var fsExtra = require("fs-extra");
var spawn = require('child_process').spawn;

var logName = __dirname + "/../logs/" + new Date().getTime() + '.log';
var downloads = __dirname + "/../tmp/downloads";

fsExtra.ensureFileSync(logName);
fsExtra.ensureDirSync(downloads);

var out = fs.openSync(logName, 'a');
var err = fs.openSync(logName, 'a');
var dir = os.homedir() + "/temp";

fsExtra.ensureDirSync(dir);

var child = spawn("node", ["--harmony", __dirname + '/../../server/index.js', "-d", dir, "-p", "9000"], {
    stdio: [ 'ignore', out, err ],
    detached: true
});

fs.writeFileSync(downloads + '/../pid', child.pid);
child.unref();
