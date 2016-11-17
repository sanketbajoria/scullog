'use strict';
(function () {
    function PermissionFactory($q, $http, $log, toastr) {
        var url = './access';
        var permissions = ["download", "stream", "refresh"];
        var role = 'default';
        var $permissions;

        function init(expiresIn) {
            $permissions = $http.get(url, {params: {t: expiresIn}}).then(function (res) {
                permissions = res.data.permissions;
                role = res.data.role;
            }, function (err) {
                $log.error('Error, while retreiving permission: ', err.status, err.data);
            });
        }

        init();
        return {
            hasPermission: function (permission) {
                return permissions.indexOf(permission) != -1;
            },
            resetPermissions: function () {
                init();
            },
            elevatedPermission: function (expiresIn) {
                init(expiresIn);
            },
            getRole: function () {
                return role;
            },
            $permissions: $permissions
        };
    }

    angular.module('FMApp').factory('PermissionFactory', PermissionFactory);
})();