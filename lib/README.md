## Contents

`/lib/`

Contains all scripts that make-up vern core functionality

`/lib/config.sample.js`

Sample configuration file that specifies hosting, administrative, and DB settings for development and production environments

`lib/controller.js`

Controller function that initializes the BaseController and exports it to the rest of the app

`/lib/db.js`

Database connection controller which detects which type of DB is present, connects, and authenticates if needed

`/lib/definitions.sample.js`

Congiuration file that defines default user settings and enables API extensions

`/lib/index.js`

Initializes application, sets middleware, then loads controllers and models

`/lib/model.js`

Initializes BaseModel as scope

`/lib/util.js`

Contains utility functions



## Config.js

This file contains most of the configuration settings for the web application


    name: 'Vern API',
    use_ssl: false,
    ssl_key: '',
    ssl_crt: '',
    base_dir: __dirname + '/',
    models_dir: __dirname + '/models',
    uploads_dir: __dirname + '/public/uploads',
    uploads_serve_dir: '/',
    uploads_types: [],
    uploads_filesize_limit: (1024 * 1024 * 4),
    registration_on: false,
    strict_logins: false,
    CORS_HEADERS: [],


 This section covers the name, SSL configuration, directories,
 upload limits, and toggles authentication features.


       development: {
       static_port: 3457,
       static_host: 'localhost',
       web_host: 'http://localhost',
       port: 3458,
       use_smtp: true,
       smtp_service: 'SMTP',
       smtp_host: 'localhost',
       smtp_port: 465,
       smtp_secure: true,
       smtp_username: '',
       smtp_password: '',
       email_from: 'Example Person <example@example.com>',
       // Database, CouchDB
       dbdriver: 'mongodb',
       databases: {
         mongodb: {
           db: 'mongodb://<hostname>/<database>',
           user: 'username',
           password: 'password'
         },
         // For future use...
         couchbase: {
           debug: true,
           hosts: ['127.0.0.1:8091'],
           user: '',
           password: '',
           bucket: '',


This section covers the development environment's host addresses, SMTP settings, and
configures the connection to your DB. The production environment configuration options
are identical.

*Currently only MongoDB is fully supported.*

## Index.js

This file is where the application is initialized and many of the nodejs dependencies are loaded

**Dependencies**

* Restify - A lightweight Node.JS framework that can create some powerful REST web services

* FS - Node.JS File System module, allows the reading and writing of files

* Path - Node.JS module for transforming file path strings

* Colors - Adds color to the Node.JS CLI

* Q - Module for making asynchronous promises

* Optimist - CLI module for Node.JS


**Loading the Config.js**


    if(!config) {
        if(fs.existsSync(cwd + '/' + configFile)) {
          var config = require(process.cwd() + '/' + configFile);
        } else {
          fs.writeFileSync(cwd + '/vern_config.js', fs.readFileSync(__dirname + '/config.sample.js'));
          return deferred.reject(new Error('No configuration found. ' + configFile.green + ' has been generated for you'));
        }
    }


This function checks to see if a config file has yet to be loaded. If one hasn't then it checks to see if there is one
in the filesystem. If not, then it creates a copy of config.sample.js for you to edit.

**Checking Environment**

    if(!config.env || !config.env[NODE_ENV]) {
        return deferred.reject(new Error('Invalid environment'));
    }

This is checking to see if there is a valid application environment (Dev or Prod)

**Connecting and configuring the database**

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

In this section, the database connection is established (in /lib/db.js) and authenticated according to the settings in
config.js. The DB connection is then returned as an object for the callback function where SSL is established, a
restify file server is initialized, and the upload directory is assigned.

**CROSS-ORIGIN RESOURCE SHARING**

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
      origins: ['*'],
      credentials: true
    }));

Ths section is where the CORS headers are setup and the application server is created.
## XXX

**Middleware**

    $scope.app.use(restify.fullResponse());
    $scope.app.use(restify.acceptParser($scope.app.acceptable));
    $scope.app.use(restify.bodyParser({overrideParams: true}));
    $scope.app.use(restify.queryParser());
    $scope.app.use(restify.gzipResponse());

This is where the middleware is setup

**Listen server**


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


This is where the application server is set to listen on assigned port.

**Error Handler**

    $scope.app.on('uncaughtException', function (req, res, route, err) {
            console.log(err.stack);
            new $scope.models.ResponseModel().handleError(res, 500, "An internal error occurred. It has been logged.");
          });

This logs an error if there is one.

**Loading Controllers**


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

This is where the controllers directory is found and cleared of any non-controllers

**Loading Models**


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


This is where the model directory is found and the scope is passed through to them.

# Controller.js

    function Controller($scope) {
      var base = $scope.BaseController;
      $scope.controller = function(config) {
        var scope = new base($scope);

        return scope;
      };

      return $scope.controller;
    }

    module.exports = Controller;

This function copies the base controller and passes the scope into it. It then returns it and exports it the the rest of
the program

# DB.js










