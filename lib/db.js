module.exports = function(config, callback) {
  if(!config.env[process.env.NODE_ENV]) {
    console.log('Error: invalid environment');
    return;
  }
  var driver = config.env[process.env.NODE_ENV].dbdriver;
  var dbconf = config.env[process.env.NODE_ENV].databases[driver];

  switch(driver) {
    case 'mongodb':
      var mongodb = require('mongodb').MongoClient;
      mongodb.connect(dbconf.db, {native_parser: true}, function(err, db) {
        if(err) {
          console.log("Failed to connect to the database");
          console.log(err);
          process.exit(1);
        }
        if(dbconf.user.length > 0) {
          return db.authenticate(dbconf.user, dbconf.password, function(err, res) {
            if(err) {
              console.log("Authentication failed connecting to the database");
              console.log(err);
              process.exit(1);
            }
            var dbObj = require('./db/' + driver)(db);
            callback(dbObj);
          });
        }
        var dbObj = require('./db/' + driver)(db);
        callback(dbObj);
      });
      break;
    default:
      console.log("No valid database, exiting");
      process.exit(1);
      break;
  }
};