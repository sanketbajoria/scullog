var Scullog = require('./index.js');

new Scullog({service: true}).initialized().then(function(){
    C.logger.info("Service started successfully");
});