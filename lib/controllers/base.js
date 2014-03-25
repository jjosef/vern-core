/**
 * BaseController handles essential CRUD operations and allows routes to be setup.
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
var path          = require('path'),
  fs              = require('fs'),
  validator       = require('validator'),
  extend          = require('node.extend'),
  Q               = require('q');

function BaseController($vern) {
  var $scope = this;

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
  $scope.model = $vern.BaseModel;
  $scope.publicRoute = '';
  $scope.publicPostRoute = '';
  $scope.publicDeleteRoute = '';
  $scope.adminRoute = '';
  $scope.userRoute = '';
  $scope.permissions = [];
  $scope.publicPermissions = []; // use this if you want access control on public routes
  $scope.$vern = $vern;

  $scope.routes = {};
  $scope.usage = {
    get: {
      before: [],
      after: []
    },
    post: {
      before: [],
      after: []
    },
    delete: {
      before: [],
      after: []
    },
    sum: {
      before: [],
      after: []
    },
    total: {
      before: [],
      after: []
    }
  };

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
    if($scope.publicRoute.length > 0) {
      var conf = {
        method: 'get',
        path: $scope.publicRoute + '/:_id',
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

    $scope = $scope.additionalCRUD($scope);

    return $scope;
  };

  $scope.initRoutes = function() {
    for(var i in $scope.routes) {
      var conf = $scope.routes[i];

      $scope.parseRoute($vern, $scope, conf);
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
  };

  $scope.handleListAccount = function(req, res, next) {
    $scope.getAccount(req, res, next);
  };

  $scope.handleListAdmin = function(req, res, next) {
    $scope.getAdmin(req, res, next);
  };

  $scope.handlePost = function(req, res, next) {
    $scope.post(req, res);
  };

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
    $scope.beforeTotal({req: req, $scope: $scope}, function(req, err) {
      if(err) {
        return res.resp.handleError(500, err);
      }

      new $scope.model().count(req.params.conditions, function(err, total) {
        if(err) {
          console.log(err);
          return res.resp.handleError(500, 'Error getting totals');
        }
        $scope.afterTotal(total, function(total) {
          res.resp.data(total);
          res.resp.send();
        });
      });
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

    $scope.beforeSum({req: req, $scope: $scope}, function(req, err) {
      if(err) {
        return res.resp.handleError(500, err);
      }

      new $scope.model().sum(req.params.conditions, req.params.field, function(err, sum) {
        if(err) {
          console.log(err);
          return res.resp.handleError(500, 'Error gettign sum');
        }

        $scope.afterSum(sum, function(sum) {
          res.resp.data(sum);
          res.resp.send();
        });
      });
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

    conditions = $vern.util.convertParamToObject(req.params.conditions);
    req.params.not = $vern.util.convertParamToObject(req.params.not);
    search = $vern.util.convertParamToObject(req.params.search);

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
        conditions._id = $vern.db.ID(req.params._id);
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
              req.params.not[i] = $vern.db.ID(req.params.not[i]);
            } catch(e) {
              return res.resp.handleError(400, 'Invalid ID in not condition');
            }
          }
          conditions[i] = { $ne: req.params.not[i] };
        }
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
      sortDir: sortDir,
      req: req,
      res: res
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
    req.params.conditions = $vern.util.convertParamToObject(req.params.conditions);
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
    $scope.beforeGet({object: conf, req: args.req, res: args.res, $scope: $scope}, function(conf, err) {
      if(err) {
        return callback(err, null);
      }
      var modelObj = new conf.model();
      conf.db = modelObj.__type;

      var sort = {};
      sort[conf.sort] = conf.sortDir;
      try {
        $vern.db.findWithRange(conf.db, conf.conditions, conf.skip, conf.limit, sort, function(err, rows) {
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
    });
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
  };

  $scope.saveAndUpload = function(eItem, req, res, next) {
    $scope.beforePost({object: eItem, req: req, res: res, $scope: $scope}, function(eItem, err) {
      if(err) {
        return res.resp.handleError(500, err);
      }
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
    });
  };

  $scope.delete = function(id, req, res) {
    $scope._delete(id, req, res, null);
  };

  $scope._delete = function(id, req, res, next) {
    var user = req.user;

    var modelObj = new $scope.model();
    new $scope.model().getById(req.params._id, function(err, obj) {
      if(err || !obj === 0) {
        return res.resp.handleError(404, 'Object does not exist');
      }

      if(modelObj.requiresOwner('delete') && user.role !== 'admin') {
        if(obj['_owner'] !== req.user._id.toString()) {
          return res.resp.handleError(403, 'Object does not belong to you');
        }
      }

      $scope.beforeDelete({object: obj, req: req, res: res, $scope: $scope}, function(obj, err) {
        if(err) {
          return res.resp.handleError(500, err);
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

          $scope.afterDelete({ok: true, object: obj}, function(data) {
            res.resp.data(data);
            res.resp.send(res);
          });
        });
      });
    });
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
        _id: $vern.db.ID(objs[i]._id)
      });
    }

    if(q.length <= 0) {
      res.resp.send(res);
      return;
    }

    var modelObj = new $scope.model();
    var db = modelObj.__type;
    $vern.db.find(db, {
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

  $scope.getRoute = function(path, method) {
    method = method.toLowerCase();
    if(method === 'delete') {
      method = 'del';
    }
    return $scope.routes[method + path];
  };

  $scope.injectParams = function(req, res, next) {
    res.resp  = new $vern.models.ResponseModel(res);
    req.$scope = $scope;
    return next();
  };

  $scope.runUsageLoop = function(process, type, index, data) {
    var deferred = Q.defer();
    $scope.usage[process][type][index](data, function(err, newData) {
      if(err) {
        return deferred.reject(err);
      }

      deferred.resolve(newData);
    });

    return deferred.promise;
  };

  /* Data is an {object: {model, skip, limit, is_admin, sort, sortDir: 1, conditions}, req, res, $scope}, must return data object to the callback */
  $scope.beforeGet = function(data, callback) {
    var promises = [];
    for(var i = 0; i < $scope.usage['get']['before'].length; i++) {
      promises.push($scope.runUsageLoop('get', 'before', i, data));
    }

    Q.all(promises).spread(function() {
      return callback(data.object);
    }).fail(function(err) {
        return callback(null, err);
      });
  };

  /* Data is an array of objects */
  $scope.afterGet = function(data, callback) {
    var promises = [];
    for(var i = 0; i < $scope.usage['get']['after'].length; i++) {
      promises.push($scope.runUsageLoop('get', 'after', i, data));
    }

    Q.all(promises).spread(function() {
      return callback(data);
    }).fail(function(err) {
        return callback(null, err);
      });
  };

  /* Data is an object {req, $scope}, must return req to the callback */
  $scope.beforeTotal = function(data, callback) {
    var promises = [];
    for(var i = 0; i < $scope.usage['total']['before'].length; i++) {
      promises.push($scope.runUsageLoop('total', 'before', i, data));
    }

    Q.all(promises).spread(function() {
      return callback(data.req);
    }).fail(function(err) {
        return callback(null, err);
      });
  };

  /* Sends total, expects total back in callback */
  $scope.afterTotal = function(total, callback) {
    var promises = [];
    for(var i = 0; i < $scope.usage['total']['after'].length; i++) {
      promises.push($scope.runUsageLoop('total', 'after', i, total));
    }

    Q.all(promises).spread(function() {
      return callback(total);
    }).fail(function(err) {
        return callback(null, err);
      });
  };

  /* Data is an object {req, $scope}, must return req to the callback */
  $scope.beforeSum = function(data, callback) {
    var promises = [];
    for(var i = 0; i < $scope.usage['sum']['before'].length; i++) {
      promises.push($scope.runUsageLoop('sum', 'before', i, data));
    }

    Q.all(promises).spread(function() {
      return callback(data.req);
    }).fail(function(err) {
        return callback(null, err);
      });
  };

  /* Sends sum, expects sum back in callback */
  $scope.afterSum = function(sum, callback) {
    var promises = [];
    for(var i = 0; i < $scope.usage['sum']['after'].length; i++) {
      promises.push($scope.runUsageLoop('sum', 'after', i, sum));
    }

    Q.all(promises).spread(function() {
      return callback(sum);
    }).fail(function(err) {
        return callback(null, err);
      });
  };

  /* Data is an object {object: Model, req: Request, $scope}, must return object to the callback */
  $scope.beforePost = function(data, callback) {
    var promises = [];
    for(var i = 0; i < $scope.usage['post']['before'].length; i++) {
      promises.push($scope.runUsageLoop('post', 'before', i, data));
    }

    Q.all(promises).spread(function() {
      return callback(data.object);
    }).fail(function(err) {
        return callback(null, err);
      });
  };

  /* Data is an object that was just created */
  $scope.afterPost = function(data, callback) {
    var promises = [];
    for(var i = 0; i < $scope.usage['post']['after'].length; i++) {
      promises.push($scope.runUsageLoop('post', 'after', i, data));
    }

    Q.all(promises).spread(function() {
      return callback(data);
    }).fail(function(err) {
        return callback(null, err);
      });
  };

  /* Data is an object {object: Model, req: Request, $scope}, must return object to the callback */
  $scope.beforeDelete = function(data, callback) {
    var promises = [];
    for(var i = 0; i < $scope.usage['delete']['before'].length; i++) {
      promises.push($scope.runUsageLoop('delete', 'before', i, data));
    }

    Q.all(promises).spread(function() {
      return callback(data.object);
    }).fail(function(err) {
        return callback(null, err);
      });
  };

  /* Data is an object {ok: Boolean, object: Model} */
  $scope.afterDelete = function(data, callback) {
    var promises = [];
    for(var i = 0; i < $scope.usage['delete']['after'].length; i++) {
      promises.push($scope.runUsageLoop('delete', 'after', i, data));
    }

    Q.all(promises).spread(function() {
      return callback(data);
    }).fail(function(err) {
        return callback(null, err);
      });
  };

  return $scope;
}

BaseController.prototype.use = function(proc, type, func) {
  $scope = this;
  $scope.usage[proc][type].push(func);
};

BaseController.prototype.parseRoute = function($vern, $scope, conf) {
  console.log("Adding [" + conf.method + "] route: " + conf.path);

  $vern.app[conf.method](conf.path, $scope.injectParams, conf.controller);
};

BaseController.prototype.additionalCRUD = function($scope) {
  return $scope;
};

BaseController.prototype.routeDefaults = {
  method: 'get',
  path: '/',
  controller: function(req, res) { res.send(404); }
};
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
BaseController.prototype.addRoute = function(opts) {
  $scope = this;
  var defaults = extend({}, $scope.routeDefaults);

  var conf;
  conf = extend({}, defaults, opts);

  if($scope.routes[conf.method + conf.path] !== undefined) {
    return;
  }

  $scope.routes[conf.method + conf.path] = conf;
};

module.exports = BaseController;