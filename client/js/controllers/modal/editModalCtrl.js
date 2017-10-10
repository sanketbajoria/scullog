'use strict';
(function () {
    var FMApp = angular.module('FMApp');

    function EditModalCtrl($scope, $rootScope, $log, $uibModalInstance, FileDownloader, FM, data, $http, Editor) {
        var vm = this;
        var __editor = null;
        vm.newLineModes = {"CRLF": "windows", "LF": "unix"};
        vm.FM = FM;
        vm.items = [];
        vm.modes = Editor.modesByName;
        vm.mode = Editor.getModeForPath(data.name) || Editor.modesByName.text;
        vm.content = vm.orig = data.content;
        vm.fileName = data.name;
        vm.editMode = data.editMode;
        vm.newLineMode = vm.content.match(/\r\n/)?"windows":"unix";
        var contentHeight = function(expand){
            return expand?$(window).height() -  $('.edit .modal-header').outerHeight(true) - $('.edit .modal-footer').outerHeight(true) - 24:$(window).height() * 70 / 100;
        }

        vm.changedMode = function(){
            __editor.getSession().setMode({path: "ace/mode/"+ vm.mode.mode, v: Date.now()});    
        }

        vm.changedNewLineMode = function(){
            __editor.getSession().setNewLineMode(vm.newLineMode);
            if(vm.newLineMode == 'unix'){
                vm.content = vm.content.replace(/\r\n/g, "\n");
            }else{
                vm.content = vm.content.replace(/\n/g, "\r\n");
            }
            
        }

        $scope.aceLoaded = function(e){
            __editor = e;
        };

        $scope.$watch('vm.expand', function(expand){
            $('.edit .modal-dialog').toggleClass('expand', expand);
            $('.edit .modal-dialog .scroll-glue').height(contentHeight(expand) + 'px');
            __editor.resize();
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

    FMApp.controller('EditModalCtrl', EditModalCtrl);
})();