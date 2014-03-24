#VERN - VIRTUAL ELASTIC RESOURCE NETWORK

Vern API is an all-in-one resource for developing scalable and easily deploy-able web applications. The central idea behind VERN is processing distribution. Processing is performed client-side whenever possible, thus reducing the load on servers enabling them to scale further. Most websites today rely on some kind of application layer to serve content. These layers perform parsing which is extremely taxing and results in the need for caching and other solutions. VERN solves this problem.
The only issue this presents is for SEO in web applications. If your project needs SEO, utilize the SEO manager built into VERN's admin panel.

**Dependencies**

* Restify - A lightweight Node.JS framework that can create some powerful REST web services

* FS - Node.JS File System module, allows the reading and writing of files

* Path - Node.JS module for transforming file path strings

* Colors - Adds color to the Node.JS CLI

* Q - Module for making asynchronous promises

* Optimist - CLI module for Node.JS

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


## Configuration

    var vern = require('vern-core');
    new vern(config).then(function($vern) {})
        .fail(function(err) {
            console.log(err.stack);
        });


Configuring Vern is as fast and simple. The 'config.js' file contains all configuration settings for the app. If no
'config.js.' file is found, 'vern_config.js' will be created for you with some default configuration settings.


    name: 'Vern API',                           // Name of the application, [string]
    use_ssl: false,                             // toggles use of SSL, [bool]
    ssl_key: '',                                // assign SSL key, [string]
    ssl_crt: '',                                // assign SSL certificate, [string]
    base_dir: __dirname + '/',                  // Set base directory, [object, string]
    models_dir: __dirname + '/models',          // Set model directory, [object, string]
    uploads_dir: __dirname + '/public/uploads', // Set uploads directory, [object, string]
    uploads_serve_dir: '/',                     //  Set upload serving directory, [object, string]
    uploads_types: [],                          // Set data types for uploads, [string]
    uploads_filesize_limit: (1024 * 1024 * 4),  // Set upload file size limit, ([int] * [int] *[int])
    registration_on: false,                     // toggles registration on or off, [bool]
    strict_logins: false,                       // resets authentication key every login, [bool]
    CORS_HEADERS: [],                           // assign Cross Origin Resource Sharing headers, [object]
         development: {
           static_port: 3457,                   // Set static port for host, [int]
           static_host: 'localhost',            // Set static host address, [string]
           web_host: 'http://localhost',        // set http web host,  [string]
           port: 3458,                          // assign port, [int]
           email_from: 'Example Person <example@example.com>',      // Set admin email, [string]
           // Database, CouchDB
           dbdriver: 'mongodb',                 // Set database driver, [string]
           databases: {
             mongodb: {
               db: 'mongodb://<hostname>/<database>', // Set database host address, [string]
               user: 'username',                // set database username, [string]
               password: 'password'             // set database password, [string]
             }

*Currently only MongoDB is fully supported.*

## Basic functions
    $vern.loadModels(dir, [recursive], [prefix])
Load models from the given directory. Options for recursive or default prefixes are also available

    $vern.loadControllers(dir, [recursive], [prefix])
Load controllers from the given directory. Options for recursive or default prefixes are also available

## Creating Models

You can create new vern models simply by calling `new $vern.model().extend(...);` on any existing model

    function MyModel() {
      this.name = null;
      this.description = null;
      return this.update(arguments[0]);
    }

    $vern.models.MyModel = new $vern.model().extend(...);

 You can extend existing models by passing a super constructor model

    function MyOtherModel() {
      this.kittens = 0;
    }
    new $vern.model().extend(MyOtherModel, {}, MyModel);
## Creating Controllers
To create a controller, just call for a `new $vern.controller();` like this:

```javascript
$vern.controllers.MyController = new $vern.controller()
 .init({
    model: MyModel,
    adminRoute: '/admin/mymodels', // administrative access only
    userRoute: '/account/mymodels', // authenticated access only
    publicRoute: '/mymodels', // public GET access
    publicPostRoute: '/mymodels', // public POST access
    publicDeleteRoute: '/mymodels', // public DELETE access
    permissions: [] // permissions setup in role definitions
    publicPermissions: [] // permissions required for user only routes
 });
```











