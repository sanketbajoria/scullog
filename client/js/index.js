'use strict';
(function () {
    var FMApp = angular.module('FMApp', ['ui.bootstrap.contextMenu', 'ui.bootstrap', 'luegg.directives', 'angular-loading-bar', 'toastr', 'ngFileUpload']);

    FMApp.config(function($httpProvider, $uibTooltipProvider, $logProvider, $compileProvider){
        $httpProvider.interceptors.push('authInterceptor');
        $uibTooltipProvider.options({"placement":"bottom"});
        $logProvider.debugEnabled(false);
        $compileProvider.debugInfoEnabled(false);
    });

})();