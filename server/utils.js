var path = require('path');
var os = require('os');
var platform = require('os').platform();
var co = require('co');
var fs = require('co-fs');
var request = require('co-request');
var origFs = require('fs');
var admzip = require('adm-zip');
var origRequest = require('request');
var Promise = require('promise');

var read = function* (path){
    var data = {};
    if(path){
        try {
            var res;
            if(path.indexOf('http') != -1){
                res = (yield request(path)).body;
            }else{
                res = yield fs.readFile(path, 'utf8')
            }
            data = JSON.parse(res);
        }
        catch (err) {
            console.log("Error: while reading file: ",path,err);
        }
    }
    return data;
}

var write = function* (path, obj){
    try {
        yield fs.writeFile(path, JSON.stringify(obj), 'utf8');
    }
    catch (err) {
        console.log("Error: while writing file: ", err);
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
    return new Promise(function(resolve, reject) {
        try {
            var stream = origFs.createWriteStream(filepath);
            stream.on('finish', function() {
                return resolve(true);
            });
            return origRequest(url).pipe(stream);
        } catch (e) {
            return reject(e);
        }
    });
};

var extractZip = function(path, extractTo) {
    return new Promise(function(resolve, reject) {
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
    var tempPath = './temp.zip'
    yield downloadFile(remotePath, tempPath);
    yield extractZip(tempPath, localPath);
};


module.exports = {
    read: read,
    write: write,
    versionCompare: versionCompare,
    extractRemoteZip: extractRemoteZip,
    filePath: function (relPath, base) {
        if (relPath.indexOf('..') >= 0) {
            var e = new Error('Do Not Contain .. in relPath!');
            e.status = 400;
            throw e;
        }else if(!!!base || global.C.data.root.indexOf(base)==-1){
            var e = new Error('Invalid base location');
            e.status = 400;
            throw e;
        }else {
            return path.join(base, relPath);
        }
    },
    getPermissions: function(role){
        return global.C.conf.actions[role] || global.C.conf.actions.default;
    },
    normalizeContent: function(content){
        if(platform == 'win32' && content.indexOf("\r\n")==-1 && content.indexOf("\n")!=-1){
            return content.replace(/\n/g,"\r\n");
        }else if((platform == 'linux' || platform == 'darwin') && content.indexOf("\r\n")!=-1){
            return content.replace(/\r\n/g,"\n");
        }
    }

};