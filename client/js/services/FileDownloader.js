'use strict';
(function () {
    var FMApp = angular.module('FMApp');

    function FileDownloader(FileSaver) {
        this.download = function (fileName, text) {
            var content = new Blob([text], {type: 'text/plain;charset=utf-8'});
            FileSaver.saveAs(content, new Date().getTime() + "_" + fileName);
        }
    }

    FMApp.service('FileDownloader', ['FileSaver', FileDownloader]);
})();