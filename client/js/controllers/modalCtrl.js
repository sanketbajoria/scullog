'use strict';
(function () {
    var FMApp = angular.module('FMApp');

    function ModalCtrl($log, $uibModalInstance, FM) {
        var vm = this;
        vm.FM = FM;
        vm.yes = function () {
            $uibModalInstance.close();
        };

        vm.no = function () {
            $uibModalInstance.dismiss('cancel');
        };

        vm.init = function () {
            $log.debug('ModalCtrl.init() invoked ...');
        };

        vm.getFileNames = function () {
            return vm.FM.selection.map(function (s) {
                return s.name;
            }).join(", ")
        };

        vm.init();
    }

    function StreamModalCtrl($scope, $rootScope, $log, $uibModalInstance, FileDownloader, FM, data) {
        var vm = this;
        vm.FM = FM;
        vm.items = [];
        vm.data = data;
        var contentHeight = function(expand){
            return expand?$(window).height() -  $('.stream .modal-header').height() - 24:$(window).height() * 70 / 100;
        }

        $scope.$watch('vm.expand', function(expand){
            $('.stream .modal-dialog').toggleClass('expand', expand);
            $('.stream .modal-dialog .scroll-glue').height(contentHeight(expand) + 'px');
        });
        $rootScope.$on('resize', function(){
            $('.stream .modal-dialog .scroll-glue').height(contentHeight(vm.expand) + 'px');
        })

        data.socket.on('line', function (line) {
            $scope.$apply(function () {
                if (angular.isArray(line))
                    Array.prototype.push.apply(vm.items, line);
                else
                    vm.items.push(line);
            });
        });

        vm.yes = function () {
            $uibModalInstance.close();
        };

        vm.no = function () {
            $uibModalInstance.dismiss('cancel');
        };

        vm.init = function () {
            $log.debug('ModalCtrl.init() invoked ...');
        };

        vm.download = function () {
            FileDownloader.download(data.name, vm.items.join("\r\n"));
        };

        vm.init();
    }

    function EditModalCtrl($scope, $rootScope, $log, $uibModalInstance, FileDownloader, FM, data, $http) {
        var vm = this;
        vm.FM = FM;
        vm.items = [];
        vm.fileName = data.name;
        vm.content = vm.orig = data.content;
        vm.editMode = data.editMode;
        var contentHeight = function(expand){
            return expand?$(window).height() -  $('.edit .modal-header').outerHeight(true) - $('.edit .modal-footer').outerHeight(true) - 24:$(window).height() * 70 / 100;
        }

        $scope.$watch('vm.expand', function(expand){
            $('.edit .modal-dialog').toggleClass('expand', expand);
            $('.edit .modal-dialog .scroll-glue').height(contentHeight(expand) + 'px');
        });
        $rootScope.$on('resize', function(){
            $('.edit .modal-dialog .scroll-glue').height(contentHeight(vm.expand) + 'px');
        });

        vm.yes = function () {
            $http[vm.editMode?'put':'post']('api' + (vm.editMode?FM.selection[0].relPath:FM.curFolderPath+vm.fileName), {content:vm.content}, {params: {type: 'WRITE_FILE'}}).then(function(data){
                FM.successData = data.data;
                $uibModalInstance.close();
            }, function(data){
                FM.errorData = data.status + ': ' + data.data;
            });
        };

        vm.no = function () {
            $uibModalInstance.dismiss('cancel');
        };

        vm.init = function () {
            $log.debug('ModalCtrl.init() invoked ...');
        };

        vm.download = function () {
            FileDownloader.download(data.name, data.content);
        };

        vm.init();
    }

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
                    vm.services[service].locked=false;
                    toastr.success(`Service ${service} ${action.m} successfully`, "Success")
                }, function(){
                    vm.services[service].locked=false;
                });
            }
            return res;
        },vm);

        vm.status = function(){
            serviceFactory.status().then(function(data){
                vm.services = initService(data);
                toastr.success(`All service status updated successfully`, "Success")
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
    FMApp.controller('StreamModalCtrl', StreamModalCtrl);
    FMApp.controller('EditModalCtrl', EditModalCtrl);
    FMApp.controller('ModalCtrl', ModalCtrl);
})();