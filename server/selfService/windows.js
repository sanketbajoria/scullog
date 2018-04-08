module.exports = function(conf){
    var windowService = require('node-windows').Service;
    var s = new windowService(conf);    
    var eventCB = {};
    function executeCB(event){
        if(eventCB[event]){
            eventCB[event].forEach(function(cb){
                cb();
            })
        }
    }
    this.install = function(){
        s.install();
    }
    this.uninstall = function(){
        s.uninstall();
    }
    this.start = function(){
        s.start();
    }
    this.stop = function(){
        s.stop();
    }
    this.on = function(event, cb){
        eventCB[event] = eventCB[event] || [];
        eventCB[event].push(cb);
    }
} 