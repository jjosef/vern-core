function Controller($scope) {
  var base = $scope.BaseModel;
  var util = require('util');
  $scope.model = function() {
    var scope = new base($scope);

    return scope;
  };

  return $scope.model;
}

module.exports = Controller;