var co = require('co');
var grep = require('./cmd/grep');
co(function* () {
    try{
var res = yield grep.exec({pattern:"ST-1-of-1", folder:"C:\\Users\\sa033ba\\Downloads\\20170203_Eng\\20170203_Eng"});
    }catch(e){
        console.log(Object.keys(e));
    }
    
    console.log(res);
});