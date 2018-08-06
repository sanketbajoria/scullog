'use strict';
import angular from 'angular';

(function () {
    var FMApp = angular.module('FMApp', ['ui.bootstrap.contextMenu', 'ui.bootstrap', 'luegg.directives', 'angular-loading-bar', 'toastr', 'ngFileUpload', 'ui.ace']);

    FMApp.config(["$httpProvider", "$uibTooltipProvider", "$logProvider", "$compileProvider", "toastrConfig", function($httpProvider, $uibTooltipProvider, $logProvider, $compileProvider, toastrConfig){
        $httpProvider.interceptors.push('authInterceptor');
        $uibTooltipProvider.options({"placement":"bottom"});
        $logProvider.debugEnabled(true);
        $compileProvider.debugInfoEnabled(false);
        angular.extend(toastrConfig, {
            maxOpened: 0,    
            newestOnTop: true,
            preventDuplicates: false,
            preventOpenDuplicates: true,
            closeButton: true,
            timeout: 4000
          });
    }]);

})();