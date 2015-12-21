var pcap = angular.module('pcap', []);

pcap.service('WS', function() {
  var socket = io.connect();
  return socket
});

pcap.controller('HomeCtrl', function($scope, WS) {    

  WS.on('list', function(data) {
    $scope._list = data;
    $scope.$digest();
  });

});
