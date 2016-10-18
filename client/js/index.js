'use strict';
(function () {
    var FMApp = angular.module('FMApp', ['ur.file', 'ui.bootstrap.contextMenu', 'ui.bootstrap', 'luegg.directives', 'ngFileSaver', 'angular-loading-bar', 'toastr']);

    FMApp.config(function($httpProvider, $locationProvider, $uibTooltipProvider, $logProvider, $compileProvider){
        $httpProvider.interceptors.push('authInterceptor');
        // FIXME: induces weird PushState security errors (i.e. tries to push 'https:')
        // $locationProvider.html5Mode(true));
        $uibTooltipProvider.options({"placement":"bottom"});
        $logProvider.debugEnabled(false);
        $compileProvider.debugInfoEnabled(false);
    });

})();