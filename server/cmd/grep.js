var exec = require('co-exec');

module.exports = {
    /**
     * {pattern: "", folder: "", recursive: "", fileMask: "", regex: "extended", ignoreCase: true/false, wholeWord: ""}
     */
    exec : function *(c){
        
        var folder = "";
        var token = c.folder.split("\\");
        for(var i=0;i<token.length;i++){
            folder += "/\"" + token[i].replace(":", "") + "\"";
        }

        var options = "";

        if(c.regex){
            options += "-E ";
        }
        if(c.ignoreCase){
            options += "-i ";
        }
        if(c.wholeWord){
            options += "-w ";
        }
        if(c.recursive){
            options += "-r ";
            if(c.fileMask){
                options += `--include=${c.fileMask} `; 
            }
        }else{
            options += "-d skip "
            folder += "/" + (c.fileMask?c.fileMask:"*");
        }
        return yield exec(`grep ${options} "${c.pattern}" ${folder}`, {maxBuffer: 1024 * 10000});
    }
}