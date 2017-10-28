var actions = ["start", "stop", "status", "restart"];

var api = function (router, scullog) {
  var svc = scullog.getFileManager().getService();
  /**
   * Start Stop, or Check Status of Service
   */
  router.get("/service", function* () {
    var action = this.request.query.a;
    var service = this.request.query.s || (action == 'status' && scullog.getConfiguration().services);
    var res = {};
    if (actions.indexOf(action) == -1 || !service) {
      res.error = `Invalid action ${action} on service ${service}`;
    } else {
      res = yield svc[action](service);
    }
    if (res.error) {
      this.status = 400;
      this.body = res.error;
    } else {
      this.body = res;
    }
  });

}

module.exports = api;