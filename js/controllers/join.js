'use strict';

angular.module('copayApp.controllers').controller('JoinController',
  function($scope, $rootScope, $timeout, controllerUtils, notification) {
    $rootScope.fromSetup = false;
    $scope.loading = false;
    $scope.isMobile = !!window.cordova;
    $rootScope.title = 'Join shared wallet';

    // QR code Scanner
    var cameraInput;
    var video;
    var canvas;
    var $video;
    var context;
    var localMediaStream;

    $scope.hideAdv = true;


    navigator.getUserMedia = navigator.getUserMedia || navigator.webkitGetUserMedia || navigator.mozGetUserMedia || navigator.msGetUserMedia;

    if (!window.cordova && !navigator.getUserMedia)
      $scope.disableScanner = 1;

    var _scan = function(evt) {
      if (localMediaStream) {
        context.drawImage(video, 0, 0, 300, 225);

        try {
          qrcode.decode();
        } catch (e) {
          //qrcodeError(e);
        }
      }

      $timeout(_scan, 500);
    };

    var _successCallback = function(stream) {
      video.src = (window.URL && window.URL.createObjectURL(stream)) || stream;
      localMediaStream = stream;
      video.play();
      $timeout(_scan, 1000);
    };

    var _scanStop = function() {
      $scope.showScanner = false;
      if (!$scope.isMobile) {
        if (localMediaStream && localMediaStream.stop) localMediaStream.stop();
        localMediaStream = null;
        video.src = '';
      }
    };

    var _videoError = function(err) {
      _scanStop();
    };

    qrcode.callback = function(data) {
      _scanStop();

      $scope.$apply(function() {
        $scope.connectionId = data;
        $scope.joinForm.connectionId.$setViewValue(data);
        $scope.joinForm.connectionId.$render();
      });
    };

    $scope.cancelScanner = function() {
      _scanStop();
    };

    $scope.openScanner = function() {
      if (window.cordova) return $scope.scannerIntent();

      $scope.showScanner = true;

      // Wait a moment until the canvas shows
      $timeout(function() {
        canvas = document.getElementById('qr-canvas');
        context = canvas.getContext('2d');

        if ($scope.isMobile) {
          cameraInput = document.getElementById('qrcode-camera');
          cameraInput.addEventListener('change', _scan, false);
        } else {
          video = document.getElementById('qrcode-scanner-video');
          $video = angular.element(video);
          canvas.width = 300;
          canvas.height = 225;
          context.clearRect(0, 0, 300, 225);

          navigator.getUserMedia({
            video: true
          }, _successCallback, _videoError);
        }
      }, 500);
    };

    $scope.scannerIntent = function() {
      cordova.plugins.barcodeScanner.scan(
        function onSuccess(result) {
          if (result.cancelled) return;

          $scope.connectionId = result.text;
          $rootScope.$digest();
        },
        function onError(error) {
          alert('Scanning error');
        });
    }


    $scope.join = function(form) {
      if (form && form.$invalid) {
        notification.error('Error', 'Please enter the required fields');
        return;
      }

      $scope.loading = true;

      $rootScope.iden.joinWallet({
        secret: $scope.connectionId,
        nickname: $scope.nickname,
        privateHex: $scope.private,
      }, function(err, w) {

        $scope.loading = false;
        if (err || !w) {
          if (err === 'joinError')
            notification.error('Fatal error connecting to Insight server');
          else if (err === 'walletFull')
            notification.error('The wallet is full');
          else if (err === 'badNetwork')
            notification.error('Network Error', 'Wallet network configuration missmatch');
          else if (err === 'badSecret')
            notification.error('Bad secret', 'The secret string you entered is invalid');
          else {
            notification.error('Error', err.message || err);
          }
          controllerUtils.onErrorDigest();
        } else {
          controllerUtils.installWalletHandlers($scope, w);
          controllerUtils.setFocusedWallet(w);
        }
      });
    }
  });
