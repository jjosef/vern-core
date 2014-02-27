function Controller($scope) {
  var base = $scope.BaseController;
  $scope.controller = function(config) {
    var scope = new base($scope);

    return scope;
  };

  return $scope.controller;
}

module.exports = Controller;