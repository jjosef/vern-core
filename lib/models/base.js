var extend = require('node.extend');
var util = require('util');
var validator = require('validator');

function BaseModel($parent) {
  this.update_time = new Date();
  this.create_time = new Date();
  this.__type = 'base'; // collection in mongo
  this.__child = null;
  this.__$parent = $parent;
  this.__indexName = '_id';
  this.__exclude_output = [];
  this.__indexes = [];
  this.__non_editable = [];
  this._additional_fields = {};
  this._location = 0;
  this._ip_address = null;
}

/**
 * Extend the BaseModel
 *
 * @method extend
 * @param {Object} constructor The object you are extending with
 * @param {Object} [options] The options for the object
 * @param {String} options.collection The collection to use
 * @param {Object} options.validations The key/value pairs for validation rules
 * @param {Object} options.validation_exceptions `{post: [], put: []}` Exceptions to typical validation rules for PUT and POST requests.
 * @param {Array} options.exclude The array of names of which keys to exclude from output
 * @param {Array} options.indexes The array of names of which keys to register as indexes
 * @param {Object} [superConstructor] The super constructor to base the model off
 */
BaseModel.prototype.extend = function(constructor, options, superConstructor) {
  var i;
  if(superConstructor) {
    constructor.prototype = new superConstructor();
  } else {
    constructor.prototype = Object.create(this);
  }

  constructor.prototype.constructor = constructor;

  if(options && options.collection) {
    constructor.prototype.use(options.collection);
  }
  if(options && options.validations) {
    constructor.prototype.__validations = extend({}, constructor.prototype.__validations, options.validations);
  }
  if(options && options.validation_exceptions) {
    constructor.prototype.__validation_exceptions = extend(true, constructor.prototype.__validation_exceptions, options.validation_exceptions);
  }
  if(options && options.exclude) {
    for(i = 0; i < options.exclude.length; i++) {
      constructor.prototype.__exclude_output.push(options.exclude[i]);
    }
  }
  if(options && options.non_editable) {
    for(i = 0; i < options.non_editable.length; i++) {
      constructor.prototype.__non_editable.push(options.non_editable[i]);
    }
  }
  if(options && options.indexes) {
    for(i = 0; i < options.indexes.length; i++) {
      constructor.prototype.addIndex(options.indexes[i]);
    }
  }

  var model = new constructor();
  model.createIndexes();

  for(i in model) {
    if(i.substr(0, 1) === '_') {
      continue;
    }
    var str = i.split('_');
    //console.log(typeof this[i] + ' ' + str);
    for(var j = 0; j < str.length; j++) {
      str[j] = str[j].charAt(0).toUpperCase() + str[j].slice(1);
    }
    var funcName = 'getBy' + str.join('');
    if(typeof model[i] === 'string' || typeof model[i] === 'number' || model[i] === null) {
      // create some simple functions to getBy<i>
      constructor.prototype[funcName] = addCustomFunction(model.__$parent, i);
    } else if(typeof model[i] === 'object') {
      // TODO:
      // getCollectionOf<i>({opts})
      // opts:
      // - limit
      // - skip
      // - conditions
    }
  }

  return constructor;
};

function addCustomFunction($parent, i) {
  return function(val, cb) {
    var $scope = this;
    var data = {};
    data[i] = val;
    $parent.db.find($scope.__type, data, function(err, res) {
      if(err) {
        return cb(err, null);
      }
      var d = [];
      for(var j = 0; j < res.length; j++) {
        var obj = $scope.new_model(res[j]);
        d.push(obj.update(res[j]));
      }
      return cb(err, d);
    });
  };
}

BaseModel.prototype._id = undefined;

/**
 * The collection to use
 *
 * @method use
 * @param type The name of the collection
 * @returns {BaseModel}
 */
BaseModel.prototype.use = function(type) {
  this.__type = type;
  return this;
};

/**
 * Set the index name
 *
 * @method setIndexName
 * @param i The name of the index
 * @returns {BaseModel}
 */
BaseModel.prototype.setIndexName = function(i) {
  this.__indexName = i;
  return this;
};

/**
 * Add an index to the database
 *
 * @method addIndex
 * @param val The name of the index
 */
BaseModel.prototype.addIndex = function(val) {
  this.__indexes.push(val);
};

/**
 * @method createIndexes
 *
 */
BaseModel.prototype.createIndexes = function() {
  var $scope = this;
  var options = null;
  for(var i = 0; i < $scope.__indexes.length; i++) {
    options = null;
    var val = $scope.__indexes[i];
    if(typeof val === 'string') {
      var name = val;
      val = {};
      val[name] = 1;
    } else if(val.__options) {
      options = val.__options;
      delete val.__options;
    }
    $scope.__$parent.db.createIndex($scope.__type, val, options, function(err, name) {
      if(err) {
        throw new Error('Could now create index: ' + name + ' on collection: ' + $scope.__type);
      }
    })
  }
};

BaseModel.prototype.__validations = {};
BaseModel.prototype.__validation_exceptions = {};
BaseModel.prototype.__defaultValidations = {
  'checkPassword': function(key, fields) {
    if(!validator.isLength(fields[key], 6)) {
      return new Error('Password must be at least 6 characters in length');
    }
    if(!validator.equals(fields[key], fields['confirm_' + key])) {
      return new Error('Passwords did not match');
    }
    return fields[key];
  },
  'checkEmail': function(key, fields) {
    if(!validator.isEmail(fields[key])) {
      return new Error('Email is invalid');
    }

    return fields[key];
  },
  'checkUsername': function(key, fields) {
    if(!validator.isLength(fields[key], 3)) {
      return new Error('Username is invalid. Must be at least 3 characters');
    }

    return fields[key];
  },
  'notEmpty': function(key, fields) {
    if(!validator.isLength(fields[key], 1)) {
      return new Error(key + ' cannot be empty');
    }

    return fields[key];
  },
  'notNull': function(key, fields) {
    if(validator.isNull(fields[key])) {
      return new Error(key + ' cannot be null');
    }

    return fields[key];
  },
  'isCreditCard': function(key, fields) {
    if(!validator.isCreditCard(fields[key])) {
      return new Error(key + ' is not a valid credit card');
    }

    return fields[key];
  }
};

BaseModel.prototype.new_model = function(data) {
  var obj = {};
  obj = new this.constructor();
  return obj;
};

BaseModel.prototype.count = function(q, cb) {
  if(!cb) {
    cb = q;
    q = null;
  }

  if(!q) {
    this.__$parent.db.count(this.__type, cb);
  } else {
    this.__$parent.db.countQuery(this.__type, q, cb);
  }
};

BaseModel.prototype.sum = function(match, field, cb) {
  this.__$parent.db.sum(this.__type, match, field, cb);
};

BaseModel.prototype.query = function(q, options, cb) {
  var $scope = this;
  if(arguments.length === 2) {
    cb = options;
    options = null;
    $scope.__$parent.db.find($scope.__type, q, function(err, res) {
      if(err) {
        return cb(err, null);
      }
      var d = [];
      for(var j = 0; j < res.length; j++) {
        var obj = $scope.new_model(res[j]);
        d.push(obj.update(res[j]));
      }
      return cb(err, d);
    });
  } else {
    var cObj = $scope.__$parent.db.findRaw($scope.__type, q);
    if(options.fields) {
      cObj = cObj.fields(options.fields);
    }
    if(options.limit) {
      cObj = cObj.limit(options.limit);
    }
    if(options.skip) {
      cObj = cObj.skip(options.skip);
    }
    if(options.sort) {
      cObj.sort(options.sort);
    }
    cObj.toArray(function(err, res) {
      if(err) {
        return cb(err, null);
      }
      var d = [];
      for(var j = 0; j < res.length; j++) {
        var obj = $scope.new_model(res[j]);
        d.push(obj.update(res[j]));
      }
      return cb(err, d);
    });
  }
};

BaseModel.prototype.queryRaw = function(q, cb) {
  var $scope = this;
  $scope.__$parent.db.find($scope.__type, q, function(err, res) {
    if(err) {
      return cb(err, null);
    }
    return cb(err, res);
  });
};

BaseModel.prototype.update = function(params) {
  var $scope = this;

  if(params) {
    var obj = $scope.new_model(params);
    for(var i in params) {
      if(typeof obj[i] === 'undefined' && i !== '_id') {
        params[i] = undefined;
        delete params[i];
        continue;
      }
      if(typeof obj[i] === 'function' && params[i]) {
        params[i] = undefined;
        delete params[i];
        continue;
      }
      if(obj[i] instanceof Array) {
        if(params[i] instanceof Array) {
          $scope[i] = params[i];
          continue;
        }
      }
      $scope[i] = params[i];
    }

    //$scope = extend(true, $scope, params);
  }

  return $scope;
};

BaseModel.prototype.save = function(cb, callSaveAfter) {
  var data = {};

  var $scope = this;
  for(var i in $scope) {
    if(i.substr(0, 2) === '__') {
      continue;
    }
    if(i.charAt(0) === '$') {
      continue;
    }
    if(typeof $scope[i] === 'undefined')
      continue;
    if(typeof $scope[i] === 'function')
      continue;
    if(typeof $scope[i] === 'object' && !($scope[i] instanceof Date) && !($scope[i] instanceof Array)) {
      var tmpObj = {};
      for(var j in $scope[i]) {
        if(typeof $scope[i][j] === 'function') {
          continue;
        }
        tmpObj[j] = $scope[i][j];
      }

      if(!Object.keys(tmpObj).length) {
        data[i] = $scope[i];
        continue;
      }
      data[i] = tmpObj;
      continue;
    }

    data[i] = $scope[i];
    if(typeof data[i] === 'string' && $scope.__$parent.util.isJSON(data[i])) {
      data[i] = JSON.parse(data[i]);
    }
  }

  data.update_time = new Date();

  if($scope._id) {
    data._id = $scope._id;
  } else {
    data.create_time = new Date();
    $scope.__$parent.db.count($scope.__type, function(err, count) {
      data._location = count;
      $scope.__$parent.db.set($scope.__type, data, function(err, doc) {
        if(err) {
          if(cb) {
            cb(err, null);
          }
          return;
        }

        $scope._id = doc._id;

        if($scope._afterSave && callSaveAfter === true) {
          $scope._afterSave();
        }

        if(cb) {
          cb(err, $scope.new_model(doc).update(doc));
        }
      });
    });
    return;
  }

  $scope.__$parent.db.set($scope.__type, data, function(err, doc) {
    if(err) {
      if(cb) {
        cb(err, null);
      }
      return;
    }

    if($scope._afterSave && callSaveAfter === true) {
      $scope._afterSave();
    }

    if(cb) {
      cb(err, $scope.new_model(doc).update(doc));
    }
  });
};

BaseModel.prototype.del = function(callback) {
  this.__$parent.db.remove(this.__type, this, callback);
};

BaseModel.prototype.getById = function(id, cb) {
  var $scope = this;

  if(!id) {
    return cb(new Error('Missing ID'), null);
  }

  try {
    if(typeof id === 'string') {
      id = this.__$parent.db.ID(id);
    }
    $scope.__$parent.db.findOne(this.__type, {_id: id}, function(err, res) {
      if(err || !res) {
        return cb(err, null);
      }

      var obj = $scope.new_model(res);
      cb(null, obj.update(res));
    });
  } catch(e) {
    cb(e, null);
  }
};

BaseModel.prototype.output = function(admin, noPre) {
  if(!noPre && this.preOutput && typeof this.preOutput === 'function') {
    this.preOutput();
    return this.output(admin, true);
  }

  var ret = {};
  for(var i in this) {
    if(i.substr(0, 2) === '__') {
      continue;
    }
    if(!admin && (i.charAt(0) === '_' && (i !== '_id' && i !== '_location'))) {
      continue;
    }
    if(typeof this[i] === 'function') {
      continue;
    }
    if(this.__exclude_output && this.__exclude_output.indexOf(i) !== -1) {
      continue;
    }

    ret[i] = this[i];
  }

  if(this.postOutput && typeof this.postOutput === 'function') {
    ret = this.postOutput(ret);
  }

  return ret;
};

/**
 * Method to alter the default output data without altering the entire function.
 *
 * @method postOutput
 * @param data
 * @returns {*}
 */
BaseModel.prototype.preOutput = function(data) {
  return data;
};

/**
 * Method to alter the default output data without altering the entire function.
 *
 * @method postOutput
 * @param data
 * @returns {*}
 */
BaseModel.prototype.postOutput = function(data) {
  return data;
};

module.exports = BaseModel;