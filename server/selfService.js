'use strict'
var linuxService = require ("./linuxSelfService");
var platform = require('os').platform();
var Service;
if(platform == 'win32'){
    Service = require('node-windows').Service;
}else if(platform == 'linux'){
    Service = function(conf){
        var eventCB = {};
        function executeCB(event){
            if(eventCB[event]){
                eventCB[event].forEach(function(cb){
                    cb();
                })
            }
        }
        
        this.install = function(){
            linuxService.add(conf.name, {displayName: conf.name, programPath: `${conf.cwd}/service.js`}, function(err){
                if(err){
                    global.C.logger.info("Error occurred, while installing as service - " + err);             
                }else{
                    executeCB('install');
                }
            });
        }
        this.uninstall = function(){
            this.stop();
            linuxService.remove(conf.name, function(err){
                if(err){
                    global.C.logger.info("Error occurred, while uninstalling service - " + err);             
                }else{
                    executeCB('uninstall');
                }
            });
        }
        this.start = function(){
          
        }
        this.stop = function(){
           
        }
        this.on = function(event, cb){
            eventCB[event] = eventCB[event] || [];
            eventCB[event].push(cb);
        }
    }//require('node-linux').Service;
}else if(platform == 'darwin'){
    Service = require('node-mac').Service;
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