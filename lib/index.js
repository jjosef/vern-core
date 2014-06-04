/*

 Built by
     __                   ____
    / /___  ______  ___  / __/___  ____
   / __/ / / / __ \/ _ \/ /_/ __ \/ __ \
  / /_/ /_/ / /_/ /  __/ __/ /_/ / /_/ /
  \__/\__, / .___/\___/_/  \____/\____/
     /____/_/
 */

function vern(config) {
  var $scope = this;

  var restify = $scope.restify = require('restify');
  var fs      = require('fs');
  var path    = require('path');
  var colors  = require('colors');
  var Q       = require('q');
  var argv    = require('optimist')
    .usage('Usage: $0 -e [environment] -p [cwd]')
    .default('e', 'development')
    .default('p', process.cwd())
    .argv;

  var deferred = Q.defer();

  var NODE_ENV = $scope.env = argv.e;
  process.env.NODE_ENV = NODE_ENV;
  var cwd = $scope.cwd = process.cwd();
  var configFile = $scope.configFile = (typeof config === 'string' ? config : 'vern_config.js');

  $scope.saveConfig = function() {
    var env = Object.create($scope.config.env);
    delete $scope.config.env;
    $scope.config.env = env;
    return fs.writeFileSync(cwd + '/' + $scope.configFile, 'module.exports = ' + JSON.stringify($scope.config, null, 2) + ';');
  };

  $scope.Q = Q;

  if(!config) {
    if(fs.existsSync(cwd + '/' + configFile)) {
      config = require(cwd + '/' + configFile);
    } else {
      fs.writeFileSync(cwd + '/' + configFile, fs.readFileSync(__dirname + '/config.sample.js'));
      config = require(cwd + '/' + configFile);
    }
  }

  var database = require('./db');

  if(!config.env || !config.env[NODE_ENV]) {
    return deferred.reject(new Error('Invalid environment'));
  }

  $scope.config = config;
  $scope.localConfig = config.env[NODE_ENV];

  if(!global.vern) {
    global.vern = $scope;
  }

  database($scope.config, function(db) {
    global.vern.db = db;
    $scope.db = db;

    var options = {
      name: config.name
    };
    /*
     if(config.use_ssl) {
     options.key = fs.readFileSync(config.ssl_key);
     options.certificate = fs.readFileSync(config.ssl_crt);
     }
     */

    restify.CORS.ALLOW_HEADERS.push('accept');
    restify.CORS.ALLOW_HEADERS.push('sid');
    restify.CORS.ALLOW_HEADERS.push('lang');
    restify.CORS.ALLOW_HEADERS.push('origin');
    restify.CORS.ALLOW_HEADERS.push('withcredentials');
    restify.CORS.ALLOW_HEADERS.push('x-requested-with');
    restify.CORS.ALLOW_HEADERS.push('apikey');
    restify.CORS.ALLOW_HEADERS.push('access-token');
    restify.CORS.ALLOW_HEADERS.push('authentication-key');
    restify.CORS.ALLOW_HEADERS.push('session-id');

    if($scope.config.CORS_HEADERS) {
      for(var i = 0; i < $scope.config.CORS_HEADERS.length; i++) {
        restify.CORS.ALLOW_HEADERS.push($scope.config.CORS_HEADERS[i]);
      }
    }
    $scope.app = restify.createServer(options);
    $scope.app.use(restify.CORS({
      origins: $scope.config.CORS_ORIGINS ? $scope.config.CORS_ORIGINS : ['*'],
      credentials: true
    }));
    $scope.app.use(restify.fullResponse());
    $scope.app.use(restify.acceptParser($scope.app.acceptable));
    $scope.app.use(restify.bodyParser({overrideParams: true}));
    $scope.app.use(restify.queryParser());
    $scope.app.use(restify.gzipResponse());

    $scope.app.listen($scope.localConfig.port, function() {
      console.log('%s listening at %s in %s mode', $scope.app.name, $scope.app.url, NODE_ENV);

      $scope.util = require('./util');

      $scope.BaseModel = require('./models/base');

      $scope.model = require('./model')($scope);
      $scope.models = {};

      $scope.models.ResponseModel = require('./models/ResponseModel');

      $scope.BaseController = require('./controllers/base');

      $scope.controller = require('./controller')($scope);

      $scope.controllers = {};

      $scope.app.on('uncaughtException', function (req, res, route, err) {
        console.log(err.stack);
        new $scope.models.ResponseModel().handleError(res, 500, "An internal error occurred. It has been logged.");
      });

      $scope.loadControllers = function(dir, recursive, prefix) {
        if(!prefix) {
          prefix = '';
        }
        var realdir = path.resolve($scope.cwd, dir);
        var files = fs.readdirSync(realdir);
        files.forEach(function(filename) {
          var isDir = fs.statSync(realdir + '/' + filename).isDirectory();
          if(isDir && recursive) {
            $scope.readControllersDir(realdir + '/' + filename, recursive, prefix + filename + '_');
          } else if(isDir) {
            return;
          }

          if(!filename.match(/(.+)\.js(on)?$/)) {
            return;
          }

          $scope.controllers[prefix + filename.slice(0, -3)] = require(realdir + '/' + filename);
          if(typeof $scope.controllers[prefix + filename.slice(0, -3)] !== 'function') {
            delete $scope.controllers[prefix + filename.slice(0, -3)];
            return;
          }
        });
      };

      $scope.loadModels = function(dir, recursive, prefix) {
        if(!prefix) {
          prefix = '';
        }
        var realdir = path.resolve($scope.cwd, dir);
        var files = fs.readdirSync(realdir);
        files.forEach(function(filename) {
          var isDir = fs.statSync(realdir + '/' + filename).isDirectory();
          if(isDir && recursive) {
            $scope.loadModels(realdir + '/' + filename, recursive, prefix + filename + '_');
          } else if(isDir) {
            return;
          }

          if(!filename.match(/(.+)\.js(on)?$/)) {
            return;
          }

          var model = require(realdir + '/' + filename);
          if(typeof model !== 'function') {
            return;
          }

          $scope.models[prefix + filename.slice(0, -3)] = model($scope);
        });
      };

      $scope.requires = function(params) {
        var i, j, errors = [];
        if(params.global) {
          for(i = 0; i < params.global.length; i++) {
            if(typeof $scope.config[params.global[i]] === 'undefined') {
              errors.push('[config] Missing "' + params.global[i] + '" in [global] configuration');
            }
          }
        }

        if(params.local) {
          for(i = 0; i < params.local.length; i++) {
            for(j in $scope.config.env) {
              if(typeof $scope.config.env[j][params.local[i]] === 'undefined') {
                errors.push('[config] Missing "' + params.local[i] + '" in [local] \'' + j + '\' configuration');
              }
            }
          }
        }

        if(params.modules) {
          for(i = 0; i < params.modules.length; i++) {
            if(!$scope.controllers[params.modules[i]] && !$scope.models[params.modules[i]]) {
              errors.push(('[config] Missing "' + params.modules[i] + '" modules'));
            }
          }
        }

        if(errors.length) {
          for(var i = 0; i < errors.length; i++) {
            console.log(errors[i]);
          }

          process.exit(0);
        }
      };

      return deferred.resolve($scope);
    });
  });

  return deferred.promise;
}

module.exports = vern;