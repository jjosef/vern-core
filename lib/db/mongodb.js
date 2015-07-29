var ObjectId = require("mongodb").ObjectID;
var mongoFunctions = function(db) {
  var $scope = this;
  $scope.locks = {};

  $scope.disconnect = function() {
    db.close();
  };

  $scope.isLocked = function(collection, data) {
    if(!data) {
      return false;
    }
    if(typeof data === 'object') {
      if(!data._id) {
        return false;
      }
    }
    if(!$scope.locks[collection]) {
      $scope.locks[collection] = {};
    }

    var d = typeof data === 'string' ? data : data._id.toString();

    if($scope.locks[collection][d]) {
      return true;
    }

    return false;
  };
  $scope.lock = function(collection, data) {
    if(!data) {
      return false;
    }
    if(typeof data === 'object') {
      if(!data._id) {
        return false;
      }
    }
    if(!$scope.locks[collection]) {
      $scope.locks[collection] = {};
    }

    var d = typeof data === 'string' ? data : data._id.toString();

    $scope.locks[collection][d] = true;
  };
  $scope.unlock = function(collection, data) {
    if(!data) {
      return false;
    }
    if(typeof data === 'object') {
      if(!data._id) {
        return false;
      }
    }
    if(!$scope.locks[collection]) {
      $scope.locks[collection] = {};
    }

    var d = typeof data === 'string' ? data : data._id.toString();

    if(!$scope.locks[collection][d]) {
      return false;
    }

    delete $scope.locks[collection][d];
  };

  $scope.ID = function(id) {
    return new ObjectId(id);
  };

  $scope.count = function(collection, callback) {
    if($scope.isLocked(collection, 'count')) {
      return setTimeout(function() {
        $scope.count(collection, callback);
      }, 1);
    }
    $scope.lock(collection, 'count');
    var cObj = db.collection(collection);
    cObj.count(function(e, cnt) {
      $scope.unlock(collection, 'count');
      callback(e, parseInt(cnt, 10));
    });
  };

  $scope.countQuery = function(collection, query, callback) {
    if($scope.isLocked(collection, 'count')) {
      return setTimeout(function() {
        $scope.countQuery(collection, query, callback);
      }, 1);
    }
    $scope.lock(collection, 'count');
    var cObj = db.collection(collection);
    cObj = cObj.find(query);
    cObj.count(function(e, cnt) {
      $scope.unlock(collection, 'count');
      callback(e, parseInt(cnt, 10));
    });
  };

  $scope.sum = function(collection, match, variable, callback) {
    if($scope.isLocked(collection, 'sum')) {
      return setTimeout(function() {
        $scope.sum(collection, match, variable, callback);
      }, 1);
    }
    $scope.lock(collection, 'sum');
    var cObj = db.collection(collection);
    cObj.aggregate([
      { $match: match },
      { $group: {
        _id: null,
        total: { $sum: '$' + variable }
      }}], function(err, result) {
      $scope.unlock(collection, 'sum');
      if(err) {
        return callback(err, null);
      }
      if(!result.length) {
        return callback(null, 0);
      }

      callback(null, result[0].total);
    });
  };

  $scope.createIndex = function(collection, val, options, callback) {
    db.ensureIndex(collection, val, options, callback);
  };

  $scope.removeIndexes = function(collection, callback) {
    var cObj = db.collection(collection);
    cObj.dropIndexes(callback);
  };

  // data should be object
  $scope.set = function(collection, data, callback) {
    if($scope.isLocked(collection, data)) {
      return setTimeout(function() {
        $scope.set(collection, data, callback)
      }, 1);
    }
    $scope.lock(collection, data);
    var cObj = db.collection(collection);
    if(data._id) {
      if(typeof data._id === 'string') {
        data._id = $scope.ID(data._id);
      }
      return cObj.findOneAndUpdate({_id: data._id}, data, {upsert: true}, function(err, result) {
        if(err) {
          return callback(err, null);
        }

        var docs = result.ops;

        if(docs === 0) {
          // We didn't save anything
          $scope.unlock(collection, data);
          return callback({
            error: true,
            message: 'Data did not save'
          }, null);
        }

        $scope.unlock(collection, data);
        callback(err, data);
      });
    }

    cObj.insertOne(data, {safe: true}, function(err, result) {
      if(err) {
        return callback(err, null);
      }

      var docs = result.ops;

      if(docs instanceof Array) {
        if(docs.length === 1) {
          $scope.unlock(collection, data);
          return callback(err, docs[0])
        }
        $scope.unlock(collection, data);
        callback(err, docs);
      } else {
        $scope.unlock(collection, data);
        callback(err, docs);
      }
    });
  };

  $scope.setRaw = function(collection, criteria, objNew, options, callback) {
    if(!options) {
      options = {new: true};
    } else if(typeof options === 'object') {
      options.new = true;
    }
    db.collection(collection).findOneAndUpdate(criteria, objNew, options, callback);
  };

  $scope.setManyRaw = function(collection, criteria, objNew, options, callback) {
    if(!callback) {
      callback = options;
      options = {multi: true};
    }
    db.collection(collection).update(criteria, objNew, options, callback);
  };

  $scope.find = function(collection, data, callback) {
    if($scope.isLocked(collection, data)) {
      return setTimeout(function() {
        $scope.find(collection, data, callback);
      }, 1);
    }
    $scope.lock(collection, data);
    var cObj = db.collection(collection);
    cObj = cObj.find(data);
    cObj.toArray(function(err, docs) {
      if(err) {
        $scope.unlock(collection, data);
        return callback(err, null, null);
      }

      $scope.unlock(collection, data);
      callback(err, docs);
    });
  };

  $scope.findOne = function(collection, data, options, callback) {
    if($scope.isLocked(collection, data)) {
      return setTimeout(function() {
        $scope.findOne(collection, data, options, callback);
      }, 1);
    }
    if(!callback) {
      callback = options;
      options = {};
    }
    $scope.lock(collection, data);
    var cObj = db.collection(collection);
    cObj.findOne(data, options, function(err, document) {
      if(err) {
        $scope.unlock(collection, data);
        return callback(err, null);
      } else {
        $scope.unlock(collection, data);
        return callback(null, document);
      }
    });
  };

  $scope.findRaw = function(collection, data, callback) {
    return db.collection(collection).find(data);
  };

  $scope.findWithRange = function(collection, data, fields, skip, limit, sort, callback) {
    if($scope.isLocked(collection, data)) {
      return setTimeout(function() {
        $scope.findWithRange(collection, data, fields, skip, limit, sort, callback);
      }, 1);
    }
    $scope.lock(collection, data);
    var cObj = db.collection(collection);
    cObj = cObj.find(data, fields);
    cObj.sort(sort).skip(skip).limit(limit).toArray(function(err, docs) {
      if(err) {
        $scope.unlock(collection, data);
        return callback(err, null, null);
      }

      $scope.unlock(collection, data);
      callback(err, docs);
    });
  };

  $scope.remove = function(collection, data, callback) {
    var cObj = db.collection(collection);
    cObj.deleteOne({_id: data._id}, function(err, removed) {
      if(err) {
        return callback(err, null);
      }
      callback(err, removed.deletedCount);
    });
  };

  $scope.bulkRemove = function(collection, data, options, callback) {
    if(!callback) {
      callback = options;
      options = {};
    }
    var cObj = db.collection(collection);
    cObj.deleteMany(data, options, function(err, removed) {
      if(err) {
        return callback(err, null);
      }
      callback(err, removed.deletedCount);
    });
  };

  return $scope;
}

module.exports = mongoFunctions;
