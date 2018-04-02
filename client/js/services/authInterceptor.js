'use strict';
(function () {
    function authInterceptor($injector, toastr) {
        return {
            request: function (config) {
                var PermissionFactory = $injector.get('PermissionFactory');
                var BasePath = $injector.get('BasePath');
                if(BasePath.activePath() && new RegExp('api|favorite').test(config.url)){
                    config.params = config.params || {};
                    config.params.base = BasePath.activePath();
                }
                config.headers["access-role"] = PermissionFactory.getRole();
                if(config.url && config.url[0] == '/'){
                    config.url = config.url.slice(1);
                }
                return config;
            },
            response: function (response) {
                var PermissionFactory = $injector.get('PermissionFactory');
                if (response.headers('access-expired') == 'true') {
                    toastr.warning("Access has been expired", "Warning");
                    PermissionFactory.resetPermissions();
                }
                return response;
            }
        };
    }

    angular.module('FMApp').factory('authInterceptor', ['$injector', 'toastr', authInterceptor]);
})();