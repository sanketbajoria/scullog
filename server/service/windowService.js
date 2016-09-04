var exec = require('co-exec');
var os = require('os');

module.exports = {
    status : function *(services){
        var res = {};
        if(!Array.isArray(services))
            services = [services];
        try{
            res.data = services.reduce(function(r,s){
                r[s]=false;
                return r;
            },{});
            var s = yield exec('net start');
            s.split(os.EOL).filter(function(l){
                return services.indexOf(l.trim())!=-1;
            }).reduce(function(r,s){
                r[s.trim()]=true;
                return r;
            },res.data);
        }catch(e){
            console.error(e, "Error, while retrieving status of service");
            res.error = e;
        }
        return res;
    },
    stop : function *(service){
        var res = {data:{name:service,action:'stop'}};
        try{
            var s = yield exec(`net stop "${service}"`);
            if(s.indexOf("stopped successfully")!=-1){
                res.data.status = "success";
            }else{
                res.error = s;
            }
        }catch(e){
            console.error(e, "Error, while stopping service");
            res.error = e;
        }
        return res;
    },
    start:function *(service){
        var res = {data:{name:service,action:'start'}};
        try{
            var s = yield exec(`net start "${service}"`);
            if(s.indexOf("started successfully")!=-1){
                res.data.status = "success";
            }else{
                res.error = s;
            }
        }catch(e){
            console.error(e, "Error, while starting service");
            res.error = e;
        }
        return res;
    },
    restart: function *(service){
        var res = {data:{name:service,action:'restart'}};
        try{
            var s = yield exec(`net stop "${service}"`);
            if(s.indexOf("stopped successfully")!=-1){
                s = yield exec(`net start "${service}"`);
                if(s.indexOf("started successfully")!=-1){
                    res.data.status = "success";
                }else{
                    res.error = s;
                }
            }else{
                res.error = s;
            }
        }catch(e){
            console.error(e, "Error, while restarting service");
            res.error = e;
        }
        return res;
    }
}