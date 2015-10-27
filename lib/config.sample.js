module.exports = {
  name: 'Vern API',
  base_dir: __dirname + '/',
  controllers_dir: __dirname + '/controllers',
  models_dir: __dirname + '/models',
  CORS_HEADERS: [],
  // CORS_ORIGINS: ['*'],
  env: {

    // Development
    development: {
      web_host: 'http://localhost',
      port: 3458,
      // Database, CouchDB
      dbdriver: 'mongodb',
      databases: {
        mongodb: {
          db: 'mongodb://localhost/vern-test',
          user: '',
          password: ''
        }
      }
    },

    // Add more environments...

    // Production
    production: {
      web_host: 'https://www.mydomain.com',
      port: 3458,
      // Database, CouchDB
      dbdriver: 'mongodb',
      databases: {
        mongodb: {
          db: 'mongodb://localhost/vern-test',
          user: '',
          password: ''
        }
      }
    }

  }
};