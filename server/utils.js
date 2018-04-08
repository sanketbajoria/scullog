var os = require('os');
var platform = require('os').platform();
var co = require('co');
var fs = require('co-fs');
var origFs = require('fs');
var admzip = require('adm-zip');
var got = require('got');
var fsExtra = require("fs-extra");
var origPath = require('path');

var read = function* (path){
    var data = {};
    if(path){
        try {
            var res;
            if(path.indexOf('http') != -1){
                res = yield got(path).then((response) => {
                                return response.body;
                            });
            }else{
                res = yield fs.readFile(path, 'utf8')
            }
            data = JSON.parse(res);
        }
        catch (err) {
            global.C.logger.info("Error: while reading file: ",path,err);
        }
    }
    return data;
}

var write = function* (path, obj){
    try {
        yield fs.writeFile(path, JSON.stringify(obj), 'utf8');
    }
    catch (err) {
        global.C.logger.info("Error: while writing file: ", err);
    }
}

var versionCompare = function(left, right) {
    if (typeof left + typeof right != 'stringstring')
        return false;

    var a = left.split('.')
        ,   b = right.split('.')
        ,   i = 0, len = Math.max(a.length, b.length);

    for (; i < len; i++) {
        if ((a[i] && !b[i] && parseInt(a[i]) > 0) || (parseInt(a[i]) > parseInt(b[i]))) {
            return 1;
        } else if ((b[i] && !a[i] && parseInt(b[i]) > 0) || (parseInt(a[i]) < parseInt(b[i]))) {
            return -1;
        }
    }
    return 0;
}

var downloadFile = function(url, filepath) {
    return new Promise((resolve, reject) => {
        try {
            var stream = origFs.createWriteStream(filepath);
            stream.on('finish', function() {
                return resolve(true);
            });
            return got.stream(url).pipe(stream);
        } catch (e) {
            return reject(e);
        }
    });
};

var extractZip = function(path, extractTo) {
    return new Promise((resolve, reject) => {
        try {
            var zip = new admzip(path);
            var zipEntries = zip.getEntries();
            zip.extractEntryTo(zipEntries[0], extractTo, false, true);
            fs.unlink(path, function(){resolve(true)});
        } catch (e) {
            return reject(e);
        }
    });
};

var extractRemoteZip = function *(remotePath, localPath) {
    var tempPath = './temp.zip';
    yield downloadFile(remotePath, tempPath);
    yield extractZip(tempPath, localPath);
    fsExtra.removeSync(tempPath);
};

module.exports = {
    read: read,
    write: write,
    versionCompare: versionCompare,
    extractRemoteZip: extractRemoteZip
};