var path = require('path');

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
    }
};