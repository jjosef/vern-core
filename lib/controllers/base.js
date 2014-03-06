/**
 * BaseController handles essnetial CRUD operations and allows routes to be setup.
 *
 * @class BaseController
 * @constructor
 * @example
 function MyClass($scope) {
        $scope.index = function(req, res, next) {
          console.log(req.params);
          res.resp.data(req.params);
          res.resp.send();
        };

        $scope.addRoute({
          path: '/',
          controller: $scope.index
        });
        $scope.addRoute({
          method: 'post',
          path: '/',
          controller: $scope.index
        });

        $scope.init(app, {
          model: 'MyModel',
          publicRoute: '/pages',
          adminRoute: '/admin/pages',
          permissions: ['admin', 'editor', 'pages']
        }); // see properties for more information
      }

 */

function BaseController($parent) {
  var path          = require('path'),
    fs              = require('fs'),
    validator       = require('validator'),
    extend          = require('node.extend'),
    Q               = require('q'),
    $scope          = this;

  /**
   The scope which holds the framework controller.

   @property $scope
   @type Object
   @param {String|Object} model The model name that the framework utilizes
   @param {String|Object} parentModel The parent model for this framework
   @param {String} parentField The field of the parent model that the model resides in
   @param {Object} [parentDefaults] A key/value pair object which specifies any default values for the parent, eg: type
   @param {String} publicRoute Used in generating CRUD routes for public access eg: `/pages'
   @param {String} adminRoute Used in generating CRUD routes for admin access eg: `/admin/pages`
   @param {Array} permissions Used in generating CRUD routes. An array of permission strings eg: `['admin', 'editor', 'page_editor']`
   **/
  $scope.model = null;
  $scope.publicRoute = '';
  $scope.publicPostRoute = '';
  $scope.publicDeleteRoute = '';
  $scope.adminRoute = '';
  $scope.userRoute = '';
  $scope.permissions = [];
  $scope.publicPermissions = []; // use this if you want access control on public routes
  $scope.routes = {};

  /**
   Initialize the base framework. Don't call this if you're calling a controller from within another controller. Should only be used on the once per application per controller.

   @method init
   **/
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

  /**
   * Create a simple error object
   *
   * @method e
   * @param message
   * @param data
   * @returns {{message: *, data: *}}
   */
  $scope.e = function(message, data) {
    return {message: message, data: data};
  };

  /**
   Method to set basic CRUD routes

   If the BaseController was called with parameter `noInit` equal to `true` it will
   not add these routes. This is useful if you need to call a controller from inside another
   controller.

   @method setCRUDRoutes
   **/
  $scope.setCRUDRoutes = function() {
    if($scope.publicRoute.length > 0) {
      var conf = {
        method: 'get',
        path: $scope.publicRoute,
        controller: $scope.handleList
      };
      if($scope.publicPermissions.length > 0) {
        conf.requiresAuth = true;
      }
      $scope.addRoute(conf);
    }
    if($scope.publicPostRoute.length > 0) {
      var conf = {
        method: 'post',
        path: $scope.publicRoute,
        controller: $scope.handlePost
      };
      if($scope.publicPermissions.length > 0) {
        conf.requiresAuth = true;
      }
      $scope.addRoute(conf);

      conf = {
        method: 'post',
        path: $scope.publicRoute + '/order',
        requiresAuth: true,
        controller: $scope.handleOrder
      };
      if($scope.publicPermissions.length > 0) {
        conf.requiresAuth = true;
      }
      $scope.addRoute(conf);
    }
    if($scope.publicDeleteRoute.length > 0) {
      var conf = {
        method: 'del',
        path: $scope.publicRoute,
        controller: $scope.handleDelete
      };
      if($scope.publicPermissions.length > 0) {
        conf.requiresAuth = true;
      }
      $scope.addRoute(conf);
    }

    if($scope.userRoute.length > 0) {
      $scope.addRoute({
        method: 'post',
        path: $scope.userRoute + '/order',
        requiresAuth: true,
        controller: $scope.handleOrder
      });
      $scope.addRoute({
        method: 'get',
        path: $scope.userRoute,
        requiresAuth: true,
        controller: $scope.handleListAccount
      });
      $scope.addRoute({
        method: 'post',
        path: $scope.userRoute,
        requiresAuth: true,
        controller: $scope.handlePost
      });
      $scope.addRoute({
        method: 'del',
        path: $scope.userRoute,
        requiresAuth: true,
        controller: $scope.handleDelete
      });
      $scope.addRoute({
        method: 'post',
        path: $scope.userRoute + '/totals',
        requiresAuth: true,
        controller: $scope.handleTotals
      });
      $scope.addRoute({
        method: 'post',
        path: $scope.userRoute + '/sum',
        requiresAuth: true,
        controller: $scope.handleSum
      });
    }
    // default CRUD for admin section.
    if($scope.adminRoute.length > 0) {
      $scope.addRoute({
        method: 'post',
        path: $scope.adminRoute + '/order',
        requiresAuth: true,
        requiresAdmin: true,
        controller: $scope.handleOrder
      });
      $scope.addRoute({
        method: 'get',
        path: $scope.adminRoute,
        requiresAuth: true,
        requiresAdmin: true,
        controller: $scope.handleListAdmin
      });
      $scope.addRoute({
        method: 'post',
        path: $scope.adminRoute,
        requiresAuth: true,
        requiresAdmin: true,
        controller: $scope.handlePost
      });
      $scope.addRoute({
        method: 'del',
        path: $scope.adminRoute,
        requiresAuth: true,
        requiresAdmin: true,
        controller: $scope.handleDelete
      });
    }

    return $scope;
  }

  /**
   Add a route.

   If the BaseController was called with parameter `noInit` equal to `true` it will
   not add these routes. This is useful if you need to call a controller from inside another
   controller.

   @method addRoute
   @param {Object} opts The options for the route
   @param {String} opts.method The request method, default is `get`
   @param {String} opts.path The path for the route, default is `/`
   @param {Function} opts.controller The function which handles the request
   @param {Boolean} opts.requiresAuth Whether the route requires authentication or not
   @param {Boolean} opts.requiresAdmin A strict requirement for admin privileges, better suited to monitor privileges by role though.
   **/
  $scope.addRoute = function(opts) {
    var defaults = {
      method: 'get',
      path: '/',
      controller: $scope.index,
      requiresAuth: false,
      requiresAdmin: false
    };

    var conf = extend(defaults, opts);

    if($scope.routes[conf.method + conf.path] !== undefined) {
      return;
    }

    $scope.routes[conf.method + conf.path] = conf;
  };

  $scope.initRoutes = function() {
    for(var i in $scope.routes) {
      var conf = $scope.routes[i];

      console.log("Adding [" + conf.method + "] route: " + conf.path);

      if(conf.requiresAuth === true) {
        $parent.app[conf.method](conf.path, checkAuth, requiresAuth, conf.controller);
      } else {
        $parent.app[conf.method](conf.path, checkAuth, conf.controller);
      }
    }
    return $scope;
  };

  $scope.validate = function(data, res, model) {
    if(!model) {
      model = new $scope.model();
    }

    if(!res) {
      res = data;
      data = model.__validations[i];
    }

    if(!data) {
      return null;
    }

    for(var i in data) {
      if(!model.__validations[i]) {
        continue;
      }

      if(typeof model.__validations[i] === 'function') {
        v = model.__validations[i](data[i]);
        if(typeof v === 'object' && v.constructor === Error) {
          res.resp.handleError(500, v);
          return null;
        }

        data[i] = v;
      } else {
        v = model.__defaultValidations[model.__validations[i]](i, data);
        if(typeof v === 'object' && v.constructor === Error) {
          res.resp.handleError(500, v);
          return null;
        }

        data[i] = v;
      }
    }

    res.checked = true;

    return data;
  };



  $scope.index = function(req, res, next) {
    res.resp.send(res);
  };

  $scope.setDefaults = function(conf) {

  };

  $scope.handleList = function(req, res, next) {
    $scope.get(req, res, next);
  }

  $scope.handleListAccount = function(req, res, next) {
    $scope.getAccount(req, res, next);
  }

  $scope.handleListAdmin = function(req, res, next) {
    $scope.getAdmin(req, res, next);
  }

  $scope.handlePost = function(req, res, next) {
    $scope.post(req, res);
  }

  $scope.handleDelete = function(req, res, next) {
    $scope.delete(req.params._id, req, res);
  };

  $scope.handleTotals = function(req, res, next) {
    var user = req.user;
    if(!req.params.conditions) {
      req.params.conditions = {
        _owner: user._id.toString()
      }
    }
    var modelObj = new $scope.model();
    if((!req.params.conditions._owner && !req.admin) || modelObj.requiresOwner('list')) {
      req.params.conditions._owner = user._id.toString();
    }
    var m = new $scope.model();
    if(!req.params.conditions.mode && m.mode) {
      req.params.conditions.mode = user.mode;
    }

    new $scope.model().count(req.params.conditions, function(err, total) {
      if(err) {
        console.log(err);
        return res.resp.handleError(500, 'Error getting totals');
      }
      res.resp.data(total);
      res.resp.send();
    });
  };

  $scope.handleSum = function(req, res, next) {
    var user = req.user;

    if(!req.params.field) {
      return res.resp.handleError(404, 'Missing field');
    }

    if(!req.params.conditions) {
      req.params.conditions = {
        _owner: user._id.toString()
      }
    }
    var modelObj = new $scope.model();
    if((!req.params.conditions._owner && !req.admin) || modelObj.requiresOwner('list')) {
      req.params.conditions._owner = user._id.toString();
    }
    if(!req.params.conditions.mode) {
      req.params.conditions.mode = user.mode;
    }

    new $scope.model().sum(req.params.conditions, req.params.field, function(err, sum) {
      if(err) {
        console.log(err);
        return res.resp.handleError(500, 'Error gettign sum');
      }

      res.resp.data(sum);
      res.resp.send();
    });
  };

  /**
   Internal method for GET - Generally, you won't use this as it bypasses any authentication checks

   @method _get
   @param req {Socket} The request socket from Restify.
   @param [req.params.skip] {Number} `(defaults to 0)`
   @param [req.params.limit] {Number} `(defaults to 10)`
   @param [req.params.conditions] {String} A JSON string which is parsed into and object of key, value pairs
   @param [req.params.search] {String} A JSON string which is parsed into and object of key, value pairs. The value of which is a regular expression
   @param [req.params.searchOptions] {String} The regexp options to be passed with all search parameters.
   @param res {Socket} The response socket for Restify
   @param [next] {Function} A chainable function useful for situations which may need to call another function outside of this scope.
   **/
  $scope._get = function(req, res, next) {
    var is_admin = req.admin;
    var skip = 0;
    var featured = false;
    var id = '';
    var limit = 50;
    var sort = '_location';
    var sortDir = 1;
    var conditions = {};
    var search = {};

    conditions = $parent.util.convertParamToObject(req.params.conditions);
    req.params.not = $parent.util.convertParamToObject(req.params.not);
    search = $parent.util.convertParamToObject(req.params.search);

    if(req.params.skip) {
      skip = parseInt(req.params.skip, 10);
    }

    if(req.params.limit) {
      limit = parseInt(req.params.limit, 10);
    }

    if(req.params.sort) {
      sort = req.params.sort;
    }

    if(req.params.sortDir) {
      sortDir = parseInt(req.params.sortDir, 10);
    }

    if(req.params._id) {
      try {
        conditions._id = $parent.db.ID(req.params._id);
      } catch(e) {
        return res.resp.handleError(400, 'Invalid ID');
      }
    }

    if(req.params.not) {
      // TODO: fix this so we can pass natual mongodb params.
      if(typeof req.params.not === 'object' && Object.keys(req.params.not).length > 0) {
        for(var i in req.params.not) {
          if(i === '_id') {
            try {
              req.params.not[i] = $parent.db.ID(req.params.not[i]);
            } catch(e) {
              return res.resp.handleError(400, 'Invalid ID in not condition');
            }
          }
          conditions[i] = { $ne: req.params.not[i] };
        }
      }
    }

    var modelObj = new $scope.model();
    if(modelObj.requiresOwner('list')) {
      if(!req.user && !req.session) {
        return res.resp.handleError(403, 'You do not have access to this data');
      }
      if(req.user && (req.user.role !== 'admin' && req.user && !req.session)) {
        conditions['_owner'] = req.user._id.toString();
      }
      if(req.session && !req.user) {
        conditions['_owner'] = req.session._owner;
      }
    }

    for(var i in search) {
      conditions[req.params.search[i]] = new RegExp(search[i], req.params.searchOptions);
    }

    $scope.listForTableData({
      model: $scope.model,
      skip: skip,
      limit: limit,
      is_admin: is_admin,
      conditions: conditions,
      sort: sort,
      sortDir: sortDir
    }, function(err, data) {
      if(err) {
        console.log(err);
        return res.resp.handleError(400, err.error + ': ' + err.reason);
      }

      $scope.afterGet(data, function(data) {
        res.resp.data(data);
        res.resp.send(res);
      });
    });
  };

  $scope.afterGet = function(data, callback) {
    return callback(data);
  };

  /**
   CRUD method for getting data

   @method get
   @param req {Socket} The request socket from Restify.
   @param [req.params.skip] {Number} `(defaults to 0)`
   @param [req.params.limit] {Number} `(defaults to 10)`
   @param [req.params.conditions] {String} A JSON string which is parsed into and object of key, value pairs
   @param res {Socket} The response socket for Restify
   @param [next] {Function} A chainable function useful for situations which may need to call another function outside of this scope.
   **/
  $scope.get = function(req, res, next) {
    $scope._get(req, res, next);
  };

  $scope.getAccount = function(req, res, next) {
    var user = req.user;
    req.params.conditions = $parent.util.convertParamToObject(req.params.conditions);
    req.params.conditions._owner = user._id.toString();
    $scope._get(req, res, next);
  };

  /**
   CRUD Admin method for getting data.

   Utilizes the permissions property

   @method getAdmin
   @param req {Socket} The request socket from Restify
   @param res {Socket} The response socket for Restify
   @param [next] {Function} A chainable function useful for situations which may need to call another function outside of this scope.
   **/
  $scope.getAdmin = function(req, res, next) {
    req.admin = true;
    $scope._get(req, res, next);
  };

  /**
   CRUD method for listing data in a table-row format

   @method listForTableData
   @param {Object} args The arguments to pass to the function
   @param {Object} args.model The model object being used for this data store
   @param {Number} args.skip The number of results to skip ahead, useful in paging
   @param {Number} args.limit The number of results to limit, defaults to `10`
   @param {Boolean} args.is_admin Whether or not this should return admin level data (such as database ID and revision information)
   @param {Object} args.conditions The JSON key: value conditions for retrieving data. Defaults to `{}`
   **/
  $scope.listForTableData = function(args, callback) {
    var defaults = {
      model: undefined,
      skip: 0,
      limit: 10,
      is_admin: false,
      sort: '_location',
      sortDir: 1,
      conditions: {}
    };

    var conf = extend(defaults, args);
    var modelObj = new conf.model();
    conf.db = modelObj.__type;

    var sort = {};
    sort[conf.sort] = conf.sortDir;
    try {
      $parent.db.findWithRange(conf.db, conf.conditions, conf.skip, conf.limit, sort, function(err, rows) {
        if(err)
          return callback(err, null);

        var data_list = [];
        for(i in rows) {
          var a = new conf.model(rows[i]);
          data_list.push(a.output(conf.is_admin));
        }

        return callback(null, data_list);
      });
    } catch(e) {
      return callback(e, null);
    }
  };

  /**
   CRUD Admin method for adding and editing data.

   Utilizes the permissions property

   @method post
   @param req {Socket} The request socket from Restify
   @param res {Socket} The response socket for Restify
   **/
  $scope.post = function(req, res, next) {
    if(!res.checked) {
      var checks = {};
      var m = new $scope.model();
      for(var i in m.__validations) {
        checks[i] = req.params[i];
      }
      if(!$scope.validate(checks, res)) {return;}
    }

    $scope._post(req, res, null);
  };

  $scope._post = function(req, res, next) {
    var user = req.user;
    var params = extend({}, req.params);

    var model = $scope.model;

    if(params._id) {
      return new model().getById(params._id, function(err, eItem) {
        if(err || !eItem) {
          return res.resp.handleError(404, 'Object not found');
        }
        // Add fields here.
        var modelObj = new model();
        if(modelObj.requiresOwner('post') && user.role !== 'admin') {
          if(eItem['_owner'] !== req.user._id.toString()) {
            return res.resp.handleError(403, 'Object does not belong to you');
          }
        }

        eItem = eItem.update(params);
        $scope.saveAndUpload(eItem, req, res, next);
      });
    } else {
      var eItem = new $scope.model(params);

      if(req.user) {
        eItem['_owner'] = req.user._id.toString();
      }

      $scope.saveAndUpload(eItem, req, res, next);
    }
  }

  $scope.saveAndUpload = function(eItem, req, res, next) {
    eItem.save(function(err, newModel) {
      if(err) {
        console.log(err);
        return res.resp.handleError(500, 'An internal server error occurred');
      }

      if(next && typeof next === 'function') {
        return next(newModel);
      }

      $scope.afterPost(newModel, function(newModel) {
        res.resp.data(newModel.output(req.is_admin));
        res.resp.send();
      });
    });
  };

  $scope.afterPost = function(model, callback) {
    return callback(model);
  };

  $scope.delete = function(id, req, res) {
    $scope._delete(id, req, res, null);
  };

  $scope._delete = function(id, req, res, next) {
    var user = req.user;

    var modelObj = new $scope.model();
    var db = modelObj.__type;
    new $scope.model().getById(req.params._id, function(err, obj) {
      if(err || !obj === 0) {
        return res.resp.handleError(404, 'Object does not exist');
      }

      if(modelObj.requiresOwner('delete') && user.role !== 'admin') {
        if(obj['_owner'] !== req.user._id.toString()) {
          return res.resp.handleError(403, 'Object does not belong to you');
        }
      }

      obj.del(function(err, obj) {
        if(next && typeof next === 'function') {
          if(err) {
            return next(err, null);
          }
          return next(null, {ok: true});
        }
        if(err) {
          console.log(err);
        }

        $scope.afterDelete({ok: true}, function(data) {
          res.resp.data(data);
          res.resp.send(res);
        });
      });
    });
  };

  $scope.afterDelete = function(data, callback) {
    return callback(data);
  };

  $scope.handleOrder = function(req, res, next) {
    var user = req.user;

    try {
      var objs = JSON.parse(req.params.order);
    } catch(e) {
      return res.resp.handleError(400, 'Invalid JSON');
    }
    var q = [];
    for(var i = 0; i < objs.length; i++) {
      q.push({
        _id: $parent.db.ID(objs[i]._id)
      });
    }

    if(q.length <= 0) {
      resp.send(res);
      return;
    }

    var modelObj = new $scope.model();
    var db = modelObj.__type;
    $parent.db.find(db, {
      '_owner': user._id.toString(),
      '$or': q
    }, function(err, body) {
      if(err) {
        return res.resp.handleError(500, 'An internal error occurred');
      }
      for(var i = 0; i < body.length; i++) {
        var entry = new $scope.model(body[i]);
        for(var j = 0; j < objs.length; j++) {
          if(objs[j]._id === entry._id.toString()) {
            entry._location = objs[j]._location;
            entry.save();
          }
        }
      }
      res.resp.send(res);
    });
  };

  function getRoute(path, method) {
    method = method.toLowerCase();
    if(method === 'delete') {
      method = 'del';
    }
    return $scope.routes[method + path];
  }

  function checkAuth(req, res, next) {
    res.resp = new $parent.models.ResponseModel(res);

    if(req.params.authenticationKey) {
      req.headers['authentication-key'] = req.params.authenticationKey;
      delete req.params.authenticationKey;
    }
    if(req.headers['authentication-key']) {

      new $parent.models.UserModel().getByAuthenticationKey(req.headers['authentication-key'], function(err, rows) {
        if(err) {
          console.log(err);
          return res.resp.handleError(403, 'Authorization Required: an error occurred');
        }
        if(rows.length <= 0) {
          req.user = null;
          return next();
        }

        req.user = new $parent.models.UserModel(rows[0]);
        return next();
      });
    } else {
      return next();
    }
  }

  function requiresAuth(req, res, next) {
    return isAuthenticated(req, res, next);
  }

  function isAuthenticated(req, res, next) {
    var check = require('validator').check;

    if(!req.user) {
      return res.resp.handleError(403, 'Authorization Required');
    }

    var permissions = [];

    var route = getRoute(req.route.path, req.route.method);
    if(!route) {
      console.log('Route not found');
      console.log(req.route);
      return res.resp.handleError(404, 'Route not found');
    }

    if(route.requiresAdmin) {
      permissions = permissions.concat($scope.permissions);
    } else if($scope.publicPermissions.length > 0) {
      permissions = permissions.concat($scope.publicPermissions);
    }

    req.user.hasPermission(permissions, function(access) {
      if(!access) {
        return res.resp.handleError(403, 'Authorization Required');
      }

      return next();
    });
  }

  return $scope;
}

module.exports = BaseController;
