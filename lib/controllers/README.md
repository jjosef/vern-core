## BaseController
The BaseController handles essential CRUD operations ad allows routes to be setup.


**Configuration**


      $scope.model = $vern.BaseModel;   // The model name that the framework utilizes [string|object]
      $scope.publicRoute = '';          // Used in generating CRUD routes for public access [string]
      $scope.publicPostRoute = '';      // Used for generating routes for POST actions from the public [string]
      $scope.publicDeleteRoute = '';    // Used for generating routes for DELETE actions from the public [string]
      $scope.adminRoute = '';           // Used in generating CRUD routes for admin access [string]
      $scope.userRoute = '';            // Used in generating CRUD routes for user access [string]
      $scope.permissions = [];          // Used in generating CRUD routes. An array of permission strings
      $scope.publicPermissions = [];    // Use this if you want access control on public routes
      $scope.routes = {};               // initializes the 'routes'
      $scope.$vern = $vern;             // Passes vern into the scope

**Init**

    $scope.init = function(configOptions) {
        if(configOptions) {
          $scope.model = (configOptions.model ? configOptions.model : $scope.model);
          $scope.publicRoute = configOptions.publicRoute ? configOptions.publicRoute : $scope.publicRoute;
          $scope.publicPostRoute = configOptions.publicPostRoute ? configOptions.publicPostRoute : $scope.publicPostRoute;
          $scope.publicDeleteRoute = configOptions.publicDeleteRoute ? configOptions.publicDeleteRoute : $scope.publicDeleteRoute;
          $scope.adminRoute = configOptions.adminRoute ? configOptions.adminRoute : $scope.adminRoute;
          $scope.userRoute = configOptions.userRoute ? configOptions.userRoute : $scope.userRoute;
          $scope.permissions = configOptions.permissions ? configOptions.permissions : $scope.permissions;
          $scope.publicPermissions = configOptions.publicPermissions ? configOptions.publicPermissions : $scope.publicPermissions;
        }
        $scope.setCRUDRoutes();
        $scope.initRoutes();
        return $scope;
      };

This initializes the base framework. Don't call this if you are calling a controller from within another controller. Should only be used on the once per application per controller.

## Setting basic CRUD routes
`$scope.setCRUDRoutes = function() {...}` is responsible for setting up all public, user, and admin routes and methods

Listed below this function are all of your basic API methods. Including wrapper functions for you to add your own functionality

    handleList
    handleListAccount
    handleListAdmin
    handlePost
    handleDelete
    handleTotals
    beforeTotal
    afterTotal
    handleSum
    beforeSum
    afterSum
    beforeGet
    afterGet
    beforeTotal
    afterTotal
    beforeSum
    afterSum
    beforePost
    afterPost
    beforeDelete
    afterDelete
    parseRoute

## Requests

**GET**

    skip            // skips the number of results received [number]
    limit           // limits number of results received [number]
    sort            // string that will sort your results by a field name in the model [string]
    sortDir         // 1 or -1 that will determined ascending or descending order [number]
    _id             // MongoDB index that indicates an object to retrieve [string]
    conditions      // An object query that filters the results of the request [object {field_name : value}]
    search          // A query that creates conditions based on a RegExp [object {field_name : pattern}]
    searchOptions   // RegExp modifiers [string]

**POST**

Objects posted without an `_id` will be created. Objects posted with an `_id` will update the corresponding object in the database.


**DELETE**

Delete requests require an `_id` in order to determine the object to be deleted.

