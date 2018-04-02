'use strict';
(function () {
    var FMApp = angular.module('FMApp');

    function FindModalCtrl($scope, $rootScope, $log, $uibModalInstance, FileDownloader, FM, data, $http) {
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

    FMApp.controller('FindModalCtrl', FindModalCtrl);
})();