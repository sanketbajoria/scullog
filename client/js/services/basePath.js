'use strict';
(function () {
    function BasePath($q, $http, $log, toastr) {
        var paths, activePath, $path;
        function init() {
            $path = $http.get('/base').then(function (res) {
                paths = res.data;
                activePath = paths[0];
            }, function (err) {
                $log.error('Error, while retreiving base: ', err.status, err.data);
            });
        }
        init();
        return {
            getPaths: function(){
              return paths;
            },
            activePath: function(path){
                if(path){
                    activePath = path;
                }
                return activePath;
            },
            $path: $path
        };
    }
    angular.module('FMApp').factory('BasePath', BasePath);
})();