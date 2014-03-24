module.exports = {
  name: 'Vern API',
  use_ssl: false, // generally better to use a proxy service on nginx/apache than to direct
  ssl_key: '',
  ssl_crt: '',
  base_dir: __dirname + '/',
  models_dir: __dirname + '/models',
  uploads_dir: __dirname + '/public/uploads',
  uploads_serve_dir: '/',
  uploads_types: [],
  uploads_filesize_limit: (1024 * 1024 * 4),
  registration_on: false,
  strict_logins: false, // true means the authentication key is reset every login. do not use this for API enabled apps
  CORS_HEADERS: [],
  env: {
  
    // Development
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
          db: 'mongodb://localhost/vern-test',
          user: '',
          password: ''
        },
        // For future use...
        couchbase: {
          debug: true,
          hosts: ['127.0.0.1:8091'],
          user: '',
          password: '',
          bucket: ''
        }
      }
    },
    
    // Production
    production: {
      static_port: null,
      static_host: 'mydomain.com',
      web_host: 'https://www.mydomain.com',
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
          db: 'mongodb://localhost/vern-test',
          user: '',
          password: ''
        },
        // For future use...
        couchbase: {
          debug: true,
          hosts: ['127.0.0.1:8091'],
          user: '',
          password: '',
          bucket: ''
        }
      }
    }
    
  }
}