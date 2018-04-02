'use strict'

var platform = require('os').platform();
var shell = require('shelljs');
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
        function installForever(){
            var r=shell.exec('whereis forever');
            global.C.logger.info(r);
            var rs = r.output && r.output.split(" ");
            if(rs && rs.length && rs.length > 1) {
                return;
            }else{
                shell.exec('npm install -g forever');
                return;
            }
        }
        this.install = function(){
            installForever();
            shell.exec(`node ${conf.cwd}/../node_modules/forever-service/bin/forever-service install -s ${conf.cwd}/service.js --start ${conf.name}`, {async: true}, function(code, output){
                if(code == 0){
                    executeCB('install');
                }
            });
        }
        this.uninstall = function(){
            installForever();
            shell.exec(`node ${conf.cwd}/../node_modules/forever-service/bin/forever-service delete ${conf.name}`, {async: true}, function(code, output){
                if(code == 0){
                    executeCB('uninstall');
                }
            });
        }
        this.start = function(){

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