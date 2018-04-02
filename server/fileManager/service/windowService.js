var os = require('os');

module.exports = function (exec) {
    exec = exec || require('co-exec');
    return {
        all: function* () {
            var res = {};
            try {
                var m = (yield exec('SC QUERY state= all |findstr "DISPLAY_NAME STATE"')).split(os.EOL).map(function (l, i) {
                    if (!!l) {
                        return (i % 2 == 1) ? (l.indexOf("RUNNING") > -1) : (l.split(":")[1].trim());
                    }
                });
                res.data = m.reduce(function (r, s, i) {
                    if (i % 2 == 0) {
                        r[s] = m[i + 1];
                    }
                    return r;
                }, {});
            } catch (e) {
                console.error(e, "Error, while retrieving status of service");
                res.error = e;
            }
            return res;
        },
        status: function* (services) {
            var res = {};
            if (!Array.isArray(services))
                services = [services];
            try {
                var m = (yield exec('SC QUERY state= all |findstr "DISPLAY_NAME STATE"')).split(os.EOL).map(function (l, i) {
                    if (!!l) {
                        return (i % 2 == 1) ? (l.indexOf("RUNNING") > -1) : (l.split(":")[1].trim());
                    }
                });
                res.data = services.reduce(function (r, s) {
                    var i = m.indexOf(s);
                    if (i > -1) {
                        r[s] = m[++i];
                    }
                    return r;
                }, {});
            } catch (e) {
                console.error(e, "Error, while retrieving status of service");
                res.error = e;
            }
            return res;
        },
        stop: function* (service) {
            var res = { data: { name: service, action: 'stop' } };
            try {
                var s = yield exec(`net stop "${service}"`);
                if (s.indexOf("stopped successfully") != -1) {
                    res.data.status = "success";
                } else {
                    res.error = s;
                }
            } catch (e) {
                console.error(e, "Error, while stopping service");
                res.error = e;
            }
            return res;
        },
        start: function* (service) {
            var res = { data: { name: service, action: 'start' } };
            try {
                var s = yield exec(`net start "${service}"`);
                if (s.indexOf("started successfully") != -1) {
                    res.data.status = "success";
                } else {
                    res.error = s;
                }
            } catch (e) {
                console.error(e, "Error, while starting service");
                res.error = e;
            }
            return res;
        },
        restart: function* (service) {
            var res = { data: { name: service, action: 'restart' } };
            try {
                var s = yield exec(`net stop "${service}"`);
                if (s.indexOf("stopped successfully") != -1) {
                    s = yield exec(`net start "${service}"`);
                    if (s.indexOf("started successfully") != -1) {
                        res.data.status = "success";
                    } else {
                        res.error = s;
                    }
                } else {
                    res.error = s;
                }
            } catch (e) {
                console.error(e, "Error, while restarting service");
                res.error = e;
            }
            return res;
        }
    }
}