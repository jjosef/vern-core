module.exports = function Model($scope) {
  var util = require('util');
  $scope.model = function() {
    return new $scope.BaseModel($scope);
  };

  return $scope.model;
};