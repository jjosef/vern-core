function Controller($scope) {
  var base = require('./controllers/base');
  var util = require('util');
  $scope.controller = function(config) {
    var scope = new base($scope);

    return scope;
  };

  return $scope.controller;
}

module.exports = Controller;