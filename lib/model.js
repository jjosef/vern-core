module.exports = function Model($scope) {
  var util = require('util');
  $scope.model = function() {
    var scope = new $scope.BaseModel($scope);

    return scope;
  };

  return $scope.model;
};