'use strict';

angular.module('copayApp.controllers').controller('HomeWalletController',
  function($scope, $rootScope, $timeout, $modal, controllerUtils) {

    controllerUtils.redirIfNotComplete();
    $rootScope.starting = false;
    $rootScope.title = 'Home';

  }
);
