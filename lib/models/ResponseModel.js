/**
 * HTTP JSON Payload class
 *
 * @class ResponseModel
 * @constructor
 **/
function ResponseModel(res) {
  /**
   The HTTP response code

   @property responseCode
   @type Number
   @default 200
   **/
  this.responseCode = 200;
  /**
   The payload send to the client

   @property pkg
   @type Object
   @param {Boolean} error The
   error status of the payload
   @param {String} statusMessage The
   text status of the payload
   @param {Object} data The
   data associated with the payload
   **/
  this.pkg = {
    error: false,
    statusMessage: '',
    data: {},
    meta: {}
  };

  /**
   The response object from restify

   @property res
   @type Object
   **/
  this.res = res || null;

  /**
   Set the response object

   @method setResponse
   @param {Object} res The response object from restify
   **/
  this.setResponse = function(res) {
    this.res = res;

    return this;
  }

  this.send = function(res) {
    if(res) {
      return res.send(this.responseCode, this.output());
    }

    if(this.res === null) {
      throw 'No response object';
    }

    try {
      this.res.send(this.responseCode, this.output());
    } catch(e) {
      return e;
    }
  };

  /**
   Set the responseCode

   @method setCode
   @param {Number} code The
   code to set on the payload
   **/
  this.setCode = function(code) {
    this.responseCode = code;

    return this;
  }

  /**
   Set an error status and message

   @method errorMessage
   @param {String} e The
   text status of the payload.
   Sets pkg.error to true.
   **/
  this.errorMessage = function(e) {
    this.pkg.error = true;
    this.pkg.statusMessage = e;

    return this;
  }

  /**
   Set the statusMessage

   @method statusMessage
   @param {String} s The
   status message to set on the payload
   **/
  this.statusMessage = function(s) {
    this.pkg.statusMessage = s;

    return this;
  }

  /**
   Set the associated data for payload

   @method data
   @param {Object} d The
   data to set on the payload
   **/
  this.data = function(d) {
    this.pkg.data = d;

    return this;
  }

  this.meta = function(key, v) {
    this.pkg.meta[key] = v;

    return this;
  }

  /**
   Returns a JSON ready object for sending via HTTP

   @method output
   **/
  this.output = function() {
    return {
      responseCode: this.responseCode,
      pkg: this.pkg
    };
  }

  this.handleError = function(res, code, status) {
    if(arguments.length === 2) {
      status = code;
      code = res;
      res = this.res;
    }
    if(typeof status === 'object' && status.message) {
      status = status.message;
    } else if(typeof status === 'object' && status.description) {
      statys = status.description;
    }
    this.setCode(code);
    this.errorMessage(status);
    this.send(res);
  };
}

module.exports = ResponseModel;