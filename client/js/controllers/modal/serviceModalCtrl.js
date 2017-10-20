'use strict';
(function () {
    var FMApp = angular.module('FMApp');

    function ServiceModalCtrl($log, $uibModalInstance, $http, FM, data, serviceFactory, toastr) {
        var vm = this;
        vm.FM = FM;
        vm.yes = function () {
            $uibModalInstance.close();
        };
        vm.services = initService(data.services);

        var actions = [{a:'start',s:true,m:"started"},{a:'stop',s:false,m:"stopped"},{a:'restart',s:true,m:"restarted"}];
        actions.reduce(function(res,action){
            res[action.a] = function(service){
                vm.services[service].locked=true;
                serviceFactory[action.a](service).then(function(){
                    vm.services[service].status = action.s;
                    toastr.success("Service " + service + " " +  action.m + " successfully", "Success")
                }).finally(function(){
                    vm.services[service].locked=false;
                });
            }
            return res;
        },vm);

        vm.status = function(){
            serviceFactory.status().then(function(data){
                vm.services = initService(data);
                toastr.success("All service status updated successfully", "Success")
            });
        }

        vm.no = function () {
            $uibModalInstance.dismiss('cancel');
        };

        vm.init = function () {
            $log.debug('ModalCtrl.init() invoked ...');

        };

        vm.init();
    }

    function initService(services){
        var ret = {}
        Object.keys(services).forEach(function(service){
            ret[service] = {status: services[service]};
        })
        return ret;
    }

    FMApp.controller('ServiceModalCtrl', ServiceModalCtrl);
})();