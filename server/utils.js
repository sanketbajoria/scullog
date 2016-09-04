var path = require('path');
var os = require('os');
var platform = require('os').platform();


var DATA_ROOT = C.data.root;

module.exports = {
    filePath: function (relPath, base) {
        if (relPath.indexOf('..') >= 0) {
            var e = new Error('Do Not Contain .. in relPath!');
            e.status = 400;
            throw e;
        }else if(!!!base || DATA_ROOT.indexOf(base)==-1){
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