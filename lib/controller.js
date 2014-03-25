function Controller($scope) {
  var base = $scope.BaseController;
  $scope.controller = function(_this) {
    var scope = new base($scope);
    for(var i in _this.prototype) {
      scope[i] = _this.prototype[i];
    }
    return scope;
  };

  return $scope.controller;
}

module.exports = Controller;