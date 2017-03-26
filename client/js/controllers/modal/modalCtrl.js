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

    FMApp.controller('ModalCtrl', ModalCtrl);
})();