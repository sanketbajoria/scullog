var fsExtra = require("fs-extra");
var fs = require("fs");

var dir = require("os").homedir() + "/temp";
if (fs.existsSync(dir)) {
    fsExtra.removeSync(dir);
}

var pidFile = __dirname + '/../tmp/pid';
if (fs.existsSync(pidFile)) {
    var pid = fs.readFileSync(pidFile);
    try{
        process.kill(pid, "SIGKILL");
    }catch(err){
        console.log(err);
    }
    fsExtra.removeSync(__dirname + '/../tmp');
}

