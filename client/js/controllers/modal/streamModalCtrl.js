'use strict';
(function () {
    var FMApp = angular.module('FMApp');

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

    FMApp.controller('StreamModalCtrl', StreamModalCtrl);
})();