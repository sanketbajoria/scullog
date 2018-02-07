'use strict';
(function () {
    function serviceFactory($http, $log, toastr, $q) {

        function url(a,s){
            return "/service?a=" + (a || "status") + (s?"&s="+s:"");
        }
        var actions = ['all', 'start', 'stop', 'restart', 'status', "add", "remove"]
        var service = actions.reduce(function(result,action){
                            result[action] = function(service){
                                return $http.get(url(action,service)).then(function(res){
                                    $log.debug(res.data);
                                    return res.data.data;
                                }, function(err){
                                    $log.error(err.status, err.data);
                                    toastr.error("Failed, " + service + " " + action,"Error");
                                    return $q.reject(err);
                                });
                            }
                            return result;
                        }, {});
        return service;
    }
    angular.module('FMApp').factory('serviceFactory', serviceFactory);
})();