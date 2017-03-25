var fsExtra = require("fs-extra");
var fs = require("fs");
var conf = require("../protractor.conf").config.params;

if (fs.existsSync(conf.baseDir)) {
    fsExtra.removeSync(conf.baseDir);
}

if (fs.existsSync(conf.pidFile)) {
    var pid = fs.readFileSync(conf.pidFile);
    try{
        process.kill(pid, "SIGKILL");
    }catch(err){
        console.log(err);
    }
    fsExtra.removeSync(conf.tmpDir);
}

