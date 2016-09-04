'use strict'

var platform = require('os').platform();
var Service;
if(platform == 'win32'){
    Service = require('node-windows').Service;
}else if(platform == 'linux'){
    Service = require('node-linux').Service;
}else if(platform == 'darwin'){
    Service = require('node-mac').Service;
}

var svc;
if(Service){
    // Create a new service object
    svc = new Service({
        name:'Scullog',
        description: 'File Manager over a browser.',
        script: 'server/index.js',
        cwd: __dirname
    });

    // Listen for the "install" event, which indicates the
    // process is available as a service.
    svc.on('install',function(){
        console.log("Installation complete");
        svc.start();
        console.log("Auto starting the application");
    });

    // Listen for the "uninstall" event so we know when it's done.
    svc.on('uninstall',function(){
        console.log('Uninstall complete.');
        console.log('The service exists: ',svc.exists);
    });
};

module.exports = svc;