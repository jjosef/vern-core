function Model(scope) {
  var model = function() {
    this.authenticationKey      = '';
    this.email                  = '';
    this.username               = '';
    this.username_lc            = '';
    this.secret                 = '';
    this.password               = '';
    this.facebook_id            = '';
    this.twitter_access_code    = '';
    this.first_name             = '';
    this.last_name              = '';
    this.company                = '';
    this.birthday               = '';
    this.create_time            = 0;
    this.last_login             = 0;
    this.registrationCode       = '';
    this.passwordCode           = '';
    this.role                   = 'inactive';
    this.gravatar_url           = null;
    this.avatar_url             = null;
    this.location		            = null;
    this.s3Bucket               = null;

    return this.update(arguments[0]);
  };

  new scope.model().extend(model, {
    collection: 'users',
    validations: {
      password: 'checkPassword',
      email: 'checkEmail',
      username: 'checkUsername',
      loginPassword: 'notNull'
    },
    indexes: [
      'authenticationKey',
      'email',
      'username_lc'
    ]
  });

  model.prototype.account = function(is_admin) {
    if(is_admin) {
      return this;
    }

    return {
      _id: this._id,
      authenticationKey: this.authenticationKey,
      email: this.email,
      username: this.username,
      first_name: this.first_name,
      last_name: this.last_name,
      birthday: this.birthday,
      create_time: this.create_time,
      last_login: this.last_login,
      role: this.role,
      avatar_url: this.avatar_url,
      gravatar_url: this.gravatar_url,
      location: this.location,
      company: this.company
    }
  };

  model.prototype.output = function(is_admin) {
    if(is_admin) {
      return this;
    }

    return {
      username: this.username,
      first_name: this.first_name,
      last_name: this.last_name,
      company: this.company,
      role: this.role,
      avatar_url: this.avatar_url,
      gravatar_url: this.gravatar_url,
      location: this.location
    }
  };

  model.prototype.hasPassword = function() {
    if(this.password.length <= 0) {
      return false;
    }

    return true;
  };

  model.prototype.hasPermission = function(arr, cb) {
    if(this.role === 'admin') {
      return cb(true);
    }
    if(arr.length <= 0) {
      return cb(true);
    }

    var permissions = require('../definitions').default_roles[this.role];

    var matches = 0;
    for(var i = 0; i < arr.length; i++) {
      if(permissions.indexOf(arr[i]) >= 0) {
        matches++;
      }
    }

    if(matches <= 0) {
      return cb(false);
    }

    return cb(true);
  };

  return model;
}

module.exports = Model;