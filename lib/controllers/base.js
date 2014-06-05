/**
 * BaseController handles essential CRUD operations and allows routes to be setup.
 *
 * @class BaseController
 * @constructor

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
   @param {String} publicRoute Used in generating CRUD routes for public GET access eg: `/pages'
   @param {String} publicPostRoute Used in generating CRUD routes for public POST/PUT access eg: `/pages'
   @param {String} publicDeleteRoute Used in generating CRUD routes for public DELETE access eg: `/pages'
   **/
  $scope.model = $vern.BaseModel;
  $scope.publicRoute = '';
  $scope.publicPostRoute = '';
  $scope.publicDeleteRoute = '';
  $scope.publicPutRoute = '';
  $scope.$vern = $vern;

  $scope.routes = {};
  $scope.initStack = {
    get: {
      before: [],
      after: []
    },
    post: {
      before: [],
      after: []
    },
    put: {
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
      $scope = $scope.additionalInit($scope, configOptions);
    }
    $scope.setCRUDRoutes();
    $scope.initRoutes();
    return $scope;
  };

  $scope.use = function(proc, type, func, priority) {
    if(typeof priority === 'undefined') {
      priority = $scope.initStack[proc][type].length;
    }
    $scope.initStack[proc][type].splice(priority, 0, func);
  };

  $scope.addUsage = function(proc, type) {
    if(!$scope.initStack[proc]) {
      $scope.initStack[proc] = {};
    }
    if(!$scope.initStack[proc][type]) {
      $scope.initStack[proc][type] = [];
    }
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
    var conf = null;
    if($scope.publicRoute.length > 0) {
      conf = {
        method: 'get',
        path: $scope.publicRoute,
        controller: $scope.handleList
      };

      $scope.addRoute(conf);
    }
    if($scope.publicRoute.length > 0) {
      conf = {
        method: 'get',
        path: $scope.publicRoute + '/:_id',
        controller: $scope.handleList
      };

      $scope.addRoute(conf);
    }
    if($scope.publicPostRoute.length > 0) {
      conf = {
        method: 'put',
        path: $scope.publicRoute + '/:_id',
        controller: $scope.handlePut
      };

      $scope.addRoute(conf);

      conf = {
        method: 'post',
        path: $scope.publicRoute,
        controller: $scope.handlePost
      };

      $scope.addRoute(conf);

      conf = {
        method: 'post',
        path: $scope.publicRoute + '/order',
        requiresAuth: true,
        controller: $scope.handleOrder
      };

      $scope.addRoute(conf);
    }
    if($scope.publicDeleteRoute.length > 0) {
      conf = {
        method: 'del',
        path: $scope.publicRoute,
        controller: $scope.handleDelete
      };

      $scope.addRoute(conf);
    }

    $scope = $scope.additionalCRUD($scope);

    return $scope;
  };

  $scope.initRoutes = function() {
    for(var i in $scope.routes) {
      var conf = $scope.routes[i];

      var compiledPath = conf.method + conf.path.replace(/[^\w\s]/gi, '');
      if($vern.app.routes[compiledPath]) {
        console.log(conf.path + ' already exists, skipping.');
        continue;
      }

      $scope.parseRoute($vern, $scope, conf);
    }
    return $scope;
  };

  $scope.handleValidations = function(req, res) {
    var checks = {};
    var method = req.method.toLowerCase();
    var m = new $scope.model();
    for(var i in m.__validations) {
      if(m.__validation_exceptions[method] && m.__validation_exceptions[method] instanceof Array) {
        if(m.__validation_exceptions[method].indexOf(i) > -1) {
          continue;
        }
      }
      checks[i] = req.params[i];
      if(m.__validations[i] === 'checkPassword') {
        checks['confirm_' + i] = req.params['confirm_' + i];
      }
    }

    if(!$scope.validate(checks, res)) {return false;}

    return checks;
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
        v = model.__validations[i](data[i], data);
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

  $scope.handlePut = function(req, res, next) {
    $scope.put(req, res);
  };

  $scope.handlePost = function(req, res, next) {
    $scope.post(req, res);
  };

  $scope.handleDelete = function(req, res, next) {
    $scope.delete(req.params._id, req, res);
  };

  $scope.handleTotals = function(req, res, next) {
    var user = req.user;

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

    if(!conditions['$or']) {
      conditions['$or'] = [];
    }

    for(var i in search) {
      var tempobj = {};
      tempobj[i] = new RegExp(search[i], req.params.searchOptions);
      conditions['$or'].push(tempobj);
    }

    if(conditions['$or'].length === 0) {
      delete conditions['$or'];
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
        return res.resp.handleError(500, err);
      }
      $scope.afterGet({objects: data, req: req, res: res, $scope: $scope}, function(data, err) {
        if(err) {
          return res.resp.handleError(500, err);
        }
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
          for(var i in rows) {
            var a = new $scope.model(rows[i]);
            data_list.push(a.output(conf.is_admin));
          }

          return callback(null, data_list);
        });
      } catch(e) {
        return callback(e, null);
      }
    });
  };

  $scope.stripEditables = function(req) {
    var model = new $scope.model();
    for(var i = 0; i < model.__non_editable.length; i++) {
      if(req.params[model.__non_editable[i]]) {
        delete req.params[model.__non_editable[i]];
      }
    }
    return req;
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
      if(!$scope.handleValidations(req, res)) {
        return;
      }
    }

    req = $scope.stripEditables(req);

    $scope._post(req, res, null);
  };

  $scope.put = function(req, res, next) {
    if(!res.checked) {
      if (!$scope.handleValidations(req, res)) {
        return;
      }
    }

    req = $scope.stripEditables(req);

    if(req.params._id) {
      var model = $scope.model;
      var params = extend({}, req.params);
      return new model().getById(params._id, function(err, eItem) {
        if(err || !eItem) {
          return res.resp.handleError(404, 'Object not found');
        }
        // Add fields here.
        var originalItem = extend({}, eItem);
        eItem = eItem.update(params);
        $scope.saveAndUpload(eItem, originalItem, req, res, next);
      });
    } else {
      return res.resp.handleError(404, 'Missing id');
    }
  };

  $scope._post = function(req, res, next) {
    var params = extend({}, req.params);

    var model = $scope.model;

    if(params._id) {
      return new model().getById(params._id, function(err, eItem) {
        if(err || !eItem) {
          return res.resp.handleError(404, 'Object not found');
        }
        // Add fields here.
        var originalItem = extend({}, eItem);
        eItem = eItem.update(params);
        $scope.saveAndUpload(eItem, originalItem, req, res, next);
      });
    } else {
      var eItem = new $scope.model(params);
      $scope.saveAndUpload(eItem, null, req, res, next);
    }
  };

  $scope.saveAndUpload = function(eItem, original, req, res, next) {
    var bmethod = req.method === 'PUT' ? 'beforePut' : 'beforePost';
    var amethod = req.method === 'PUT' ? 'afterPut' : 'afterPost';
    $scope[bmethod]({object: eItem, original: original, req: req, res: res, $scope: $scope}, function(eItem, err) {
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

        $scope[amethod]({object: newModel, req: req, res: res, $scope: $scope}, function(newModel, err) {
          if(err) {
            return res.resp.handleError(500, err);
          }
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

    new $scope.model().getById(req.params._id, function(err, obj) {
      if(err || !obj) {
        return res.resp.handleError(404, 'Object does not exist');
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

          $scope.afterDelete({ok: true, object: obj, req: req, res: res, $scope: $scope}, function(data, err) {
            if(err) {
              return res.resp.handleError(500, err);
            }
            res.resp.data(data.ok);
            res.resp.send();
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
      res.resp.send();
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

  $scope.runStackLoop = function(process, type, index, data) {
    var deferred = Q.defer();
    $scope.initStack[process][type][index](data, function(err, newData) {
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
    for(var i = 0; i < $scope.initStack['get']['before'].length; i++) {
      promises.push($scope.runStackLoop('get', 'before', i, data));
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
    for(var i = 0; i < $scope.initStack['get']['after'].length; i++) {
      promises.push($scope.runStackLoop('get', 'after', i, data));
    }

    Q.all(promises).spread(function() {
      return callback(data.objects);
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
    for(var i = 0; i < $scope.initStack['total']['before'].length; i++) {
      promises.push($scope.runStackLoop('total', 'before', i, data));
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
    for(var i = 0; i < $scope.initStack['total']['after'].length; i++) {
      promises.push($scope.runStackLoop('total', 'after', i, data));
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
    for(var i = 0; i < $scope.initStack['sum']['before'].length; i++) {
      promises.push($scope.runStackLoop('sum', 'before', i, data));
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
    for(var i = 0; i < $scope.initStack['sum']['after'].length; i++) {
      promises.push($scope.runStackLoop('sum', 'after', i, data));
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
    for(var i = 0; i < $scope.initStack['post']['before'].length; i++) {
      promises.push($scope.runStackLoop('post', 'before', i, data));
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
    for(var i = 0; i < $scope.initStack['post']['after'].length; i++) {
      promises.push($scope.runStackLoop('post', 'after', i, data));
    }

    Q.all(promises).spread(function() {
      return callback(data.object);
    }).fail(function(err) {
      return callback(null, err);
    });
  };

  /* Data is an object {object: Model, req: Request, $scope}, must return object to the callback */
  $scope.beforePut = function(data, callback) {
    var promises = [];
    for(var i = 0; i < $scope.usage['put']['before'].length; i++) {
      promises.push($scope.runUsageLoop('put', 'before', i, data));
    }
    for(var i = 0; i < $scope.initStack['put']['before'].length; i++) {
      promises.push($scope.runStackLoop('put', 'before', i, data));
    }

    Q.all(promises).spread(function() {
      return callback(data.object);
    }).fail(function(err) {
      return callback(null, err);
    });
  };

  /* Data is an object that was just created */
  $scope.afterPut = function(data, callback) {
    var promises = [];
    for(var i = 0; i < $scope.usage['put']['after'].length; i++) {
      promises.push($scope.runUsageLoop('put', 'after', i, data));
    }
    for(var i = 0; i < $scope.initStack['put']['after'].length; i++) {
      promises.push($scope.runStackLoop('put', 'after', i, data));
    }

    if(!promises.length) {
      return callback(data.object);
    }
    Q.all(promises).spread(function() {
      return callback(data.object);
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
    for(var i = 0; i < $scope.initStack['delete']['before'].length; i++) {
      promises.push($scope.runStackLoop('delete', 'before', i, data));
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
    for(var i = 0; i < $scope.initStack['delete']['after'].length; i++) {
      promises.push($scope.runStackLoop('delete', 'after', i, data));
    }

    Q.all(promises).spread(function() {
      return callback(data);
    }).fail(function(err) {
      return callback(null, err);
    });
  };

  return $scope;
}

BaseController.prototype.usage = {
  get: {
    before: [],
    after: []
  },
  post: {
    before: [],
    after: []
  },
  put: {
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

BaseController.prototype.crud = [];
BaseController.prototype.inits = [];

BaseController.prototype.use = function(proc, type, func, priority) {
  var $scope = this;
  if(typeof priority === 'undefined') {
    priority = $scope.usage[proc][type].length;
  }
  $scope.usage[proc][type].splice(priority, 0, func);
};

BaseController.prototype.parseRoute = function($vern, $scope, conf) {
  console.log("Adding [" + conf.method + "] route: " + conf.path);

  if($vern.app.routes[conf.method + conf.controller]) {
    return;
  }
  $vern.app[conf.method](conf.path, $scope.injectParams, conf.controller);
};

BaseController.prototype.additionalCRUD = function($scope) {
  for(var i = 0; i < this.crud.length; i++) {
    $scope = this.crud[i]($scope);
  }
  return $scope;
};

BaseController.prototype.addCRUD = function(func) {
  this.crud.push(func);
  return this;
};

BaseController.prototype.additionalInit = function($scope, configOptions) {
  for(var i = 0; i < $scope.inits.length; i++) {
    $scope = $scope.inits[i]($scope, configOptions);
  }
  return $scope;
};

BaseController.prototype.addInit = function(func) {
  this.inits.push(func);
  return this;
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
 **/
BaseController.prototype.addRoute = function(opts) {
  var $scope = this;
  var defaults = extend({}, $scope.routeDefaults);

  var conf;
  conf = extend({}, defaults, opts);

  if($scope.routes[conf.method + conf.path] !== undefined) {
    return console.log(conf.path + ' already exists, skipping.');
  }

  $scope.routes[conf.method + conf.path] = conf;
};

module.exports = BaseController;