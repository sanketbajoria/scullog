'use strict';
(function () {
    var FMApp = angular.module('FMApp');

    function FileDownloader() {
        this.download = function (fileName, text, original, binary) {
            var content = new Blob([text], {type: 'application/zip'});
            saveAs(content, (original?"":(new Date().getTime() + "_")) + fileName + (binary?".zip":""));
        }
    }

    FMApp.service('FileDownloader', FileDownloader);
})();