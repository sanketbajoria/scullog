var co = require('co');
var util = require('../server/utils');

describe("get package.json", function () {
    it("should connect directly to server with password", function (done) {
        co(function* () {
            try {
                var res = yield util.read("https://raw.githubusercontent.com/sanketbajoria/scullog/master/package.json");
                expect(res.name).toBe('scullog');
            } catch (e) {
                console.log(e);
            } finally {
                done();
            }
        });
    });

    it("should extract the zip", function (done) {
        co(function* () {
            try {
                yield util.extractRemoteZip("https://github.com/sanketbajoria/scullog/archive/master.zip", "D:\\temp\\scullog");
            } catch (e) {
                console.log(e);
            } finally {
                done();
            }
        });
    })
});   