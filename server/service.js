var platform = require('os').platform();
var Service;
if(platform == 'win32'){
    Service = require('./service/windowService');
}else if(platform == 'linux'){
    Service = require('./service/linuxService');
}else if(platform == 'darwin'){
    Service = require('./service/linuxService');
}

module.exports = Service;
