var platform = require('os').platform();
var Service;
if(platform == 'win32'){
    Service = require('./windowService');
}else if(platform == 'linux'){
    Service = require('./linuxService');
}else if(platform == 'darwin'){
    Service = require('./linuxService');
}

module.exports = Service;
