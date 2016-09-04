    'use strict';
(function () {
    var FMApp = angular.module('FMApp');

    function highlight($sce){
        return function(text, phrase) {
            if (phrase) text = text.replace(new RegExp('('+phrase+')', 'gi'),
                '<span class="searched">$1</span>')
            return $sce.trustAsHtml(text)
        }
    }

    function serviceStatus($sce){
        return function(v) {
            var ret;
            if(v.locked){
                ret = "<span class='fa fa-circle' style='color: #f0ad4e;'></span> processing";
            }else if(v.status){
                ret = "<span class='fa fa-circle' style='color: #5cb85c;'></span> running";
            }else{
                ret = "<span class='fa fa-circle' style='color: #d9534f;'></span> stopped";
            }
            return $sce.trustAsHtml(ret)
        }
    }

    function humanSize(){
       return function(file){
           if(file.folder) return '';
           var size = file.size;
           var hz;
           if (size < 1024) hz = size + ' B';
           else if (size < 1024*1024) hz = (size/1024).toFixed(2) + ' KB';
           else if (size < 1024*1024*1024) hz = (size/1024/1024).toFixed(2) + ' MB';
           else hz = (size/1024/1024/1024).toFixed(2) + ' GB';
           return hz;
       }
    }

    function humanTime(){
        return function(timestamp){
            var t = new Date(timestamp);
            return t.toLocaleDateString() + ' ' + t.toLocaleTimeString();
        }
    }

    FMApp.filter('highlight', ['$sce', highlight]);
    FMApp.filter('humanSize', humanSize);
    FMApp.filter('humanTime', humanTime);
    FMApp.filter('serviceStatus', serviceStatus);

})();