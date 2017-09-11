'use strict';
(function () {
    var FMApp = angular.module('FMApp');

    function FileDownloader() {
        this.download = function (fileName, text, original, binary) {
            var content = new Blob([text], {type: binary?'application/zip':'application/octet-stream'});
            saveAs(content, (original?"":(new Date().getTime() + "_")) + fileName + (binary?".zip":""));
        }
    }

    FMApp.service('FileDownloader', FileDownloader);
})();