/* //var co = require('co');
//var grep = require('./cmd/grep');





// co(function* () {
//     try {
//         var res = yield grep.exec({ pattern: "ST-1-of-1", folder: "C:\\Users\\sa033ba\\Downloads\\20170203_Eng\\20170203_Eng" });
//     } catch (e) {
//         console.log(Object.keys(e));
//     }

//     console.log(res);
// });


var ilib=require("ilib");

//console.log(new ilib.Address("JOHN GULLIBLE DOE\nCENTER FOR FINANCIAL ASSISTANCE TO DEPOSED NIGERIAN ROYALTY\n421 E DRACHMAN\nTUCSON AZ 85705-7598\nUSA"));
console.log(new ilib.Address("MARY ROE\nMEGASYSTEMS INC\nSUITE 5A-1204\n799 E DRAGRAM\nTUCSON AZ 85705\nUSA"));

//console.log(new ilib.Address("CHRIS NISWANDEE\nSMALLSYS INC\n795 E DRAGRAM\nTUCSON AZ 85705\nUSA"));

console.log(new ilib.Address("CHRIS NISWANDEE\nBITBOOST\nPOB 65502\nTUCSON AZ 85728\nUSA")); */
/* 
var server = require('./index.js')({
    port: 8888,
    directory: ["C:\\"],
    config: __dirname + "/../sample.json"
})
 */

var request = require('request');
var co = require('co');


var res = co(function* () {
    console.log(yield new Promise((resolve, reject) => {
        request("https://raw.githubusercontent.com/cthackers/adm-zip/master/package.json", (err, response, body) => {
            if(err)
                reject(err);
            resolve(body);
        });
    }));
});