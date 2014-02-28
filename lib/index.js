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

  var restify = require('restify');
  var fs      = require('fs');
  var colors  = require('colors');
  var Q       = require('q');
  var argv    = require('optimist')
    .usage('Usage: $0 -e [string]')
    .default('e', 'development')
    .argv;

  var deferred = Q.defer();

  var NODE_ENV = argv.e;
  process.env.NODE_ENV = NODE_ENV;
  var cwd = process.cwd();
  var configFile = 'vern_config.js';

  if(!config) {
    if(fs.existsSync(cwd + '/' + configFile)) {
      var config = require(process.cwd() + '/' + configFile);
    } else {
      fs.writeFileSync(cwd + '/vern_config.js', fs.readFileSync(__dirname + '/config.sample.js'));
      return deferred.reject(new Error('No configuration found. ' + configFile.green + ' has been generated for you'));
    }
  }

  var database = require('./db');

  if(!config.env || !config.env[NODE_ENV]) {
    return deferred.reject(new Error('Invalid environment'));
  }

  $scope.config = config;
  $scope.localConfig = config.env[NODE_ENV];

  if(!global.vern) {
    global.vern = {};
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
    if($scope.localConfig.static_port) {
      var publicServer = restify.createServer({
        name: $scope.config.name + ' public file server'
      });

      publicServer.listen($scope.localConfig.static_port, function() {
        console.log('%s listening at %s in %s mode', publicServer.name, publicServer.url, NODE_ENV);
      });

      publicServer.get($scope.config.uploads_serve_dir + '.*', restify.serveStatic({
        directory: $scope.config.uploads_dir
      }));
    }

    $scope.app = restify.createServer(options);
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
    $scope.app.use(restify.CORS());
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
      $scope.models.UserModel = require('./models/UserModel')($scope);
      $scope.models.ResponseModel = require('./models/ResponseModel');
      $scope.BaseController = require('./controllers/base');
      $scope.controller = require('./controller')($scope);
      $scope.controllers = {};

      return deferred.resolve($scope);
    });
  });

  return deferred.promise;
}

module.exports = vern;