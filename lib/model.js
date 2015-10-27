module.exports = function Model($scope) {
  $scope.model = function() {
    return new $scope.BaseModel($scope);
  };

  return $scope.model;
};