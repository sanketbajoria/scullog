var co = require('co');
var fs = require('co-fs');
var request = require('koa-request');

var read = function* (path){
    var data = {};
    if(path){
        try {
            var res;
            if(path.indexOf('http') != -1){
                res = (yield request({url: path})).body;
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

var write = function* (obj, path){
    try {
        yield fs.writeFile(path, JSON.stringify(obj), 'utf8');
    }
    catch (err) {
        console.log("Error: while writing file: ", err);
    }
}

module.exports = {
    read: read,
    write: write
};