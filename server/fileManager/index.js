var NodeFileManager = require('./nodeFileManager');
if(global.C.conf.fileManager){
    if(typeof global.C.conf.fileManager == 'string'){
        module.exports = require(global.C.conf.fileManager)();
    }else{
        module.exports = global.C.conf.fileManager;
    }
}else{
    module.exports = new NodeFileManager();   
}