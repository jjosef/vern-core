module.exports = {
  isJSON: function(data) {
    var isJson = false;
    try {
      var json = JSON.parse(data);
      isJson = (typeof json === 'object');
    } catch (ex) {
    }
    return isJson;
  },
  convertParamToObject: function(param) {
    if(param && typeof param === 'string') {
      try {
        param = JSON.parse(param);
      } catch(e) {
        return {};
      }
    } else if(!param) {
      return {};
    }

    return param;
  },
  apiKey: function() {
    var salt = new Date().getTime();
    var uuid = require('node-uuid')();
    return require('crypto').createHash('sha256').update(uuid).update(salt.toString()).digest('hex');
  },
  createGUID: function() {
    var d = new Date().getTime();
    var uuid = 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, function(c) {
      var r = (d + Math.random()*16)%16 | 0;
      d = Math.floor(d/16);
      return (c=='x' ? r : (r&0x7|0x8)).toString(16);
    });
    return uuid;
  },
  generatePrefix: function() {
    return (Math.floor(Math.random() * 1000000000)).toString(36);
  }
};