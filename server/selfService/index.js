'use strict'
var platform = require('os').platform();
var Service;
if(platform == 'win32'){
    Service = require("./windows")
}else if(platform == 'linux'){
    Service = require ("./linux"); //require('node-linux').Service;
}else if(platform == 'darwin'){
    Service = require ("./darwin");
}

var svc;
if(Service){
    // Create a new service object
    svc = new Service({
        name:'Scullog',
        description: 'File Manager over a browser.',
        script: 'server/service.js',
        cwd: __dirname
    });
    svc.restart = function(){
        svc.stop();
        setTimeout(function(){
            svc.start();
        },15000);
    }

    // Listen for the "install" event, which indicates the
    // process is available as a service.
    svc.on('install',function(){
        global.C.logger.info("Installation complete");
        svc.start();
        global.C.logger.info("Auto starting the application");
    });

    // Listen for the "uninstall" event so we know when it's done.
    svc.on('uninstall',function(){
        global.C.logger.info('Uninstall complete.');
        global.C.logger.info('The service exists: ',svc.exists);
    });
}; 

module.exports = svc;