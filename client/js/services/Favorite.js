'use strict';
(function () {
    function Favorite(BasePath, $http, $log, toastr) {
        var favorites, $favorite;
        function init() {
            $favorite = $http.get('/favorite').then(function (res) {
                favorites = res.data;
            }, function (err) {
                $log.error('Error, while retreiving favorite: ', err.status, err.data);
            });
        }
        init();
        return {
            get: function(){
                return favorites || {};
            },
            is: function(path){
              return this.get()[BasePath.activePath()] && path in this.get()[BasePath.activePath()];
            },
            add: function(path, name){
                $http.post('/favorite',{name: name || path, path:path}).then(function (res) {
                    favorites = res.data;
                    toastr.success("Added to favorites","Success");
                }, function (err) {
                    toastr.error("Failed, adding to favorites","Failed");
                    $log.error('Error, while adding favorite: ', err.status, err.data);
                });
            },
            remove: function(path){
                $http.delete('/favorite',{params:{path:path}}).then(function (res) {
                    favorites = res.data;
                    toastr.success("Removed from favorites","Success");
                }, function (err) {
                    toastr.error("Failed, removing from favorites","Failed");
                    $log.error('Error, while deleting favorite: ', err.status, err.data);
                });
            },
            init: init,
            $favorite: $favorite
        };
    }
    angular.module('FMApp').factory('Favorite', Favorite);
})();