var util = require('util');
var passportTypes = require("@itiancai/passport-client");
var common_types = passportTypes.common_types;

module.exports = {};

var AbstractException = function (message, constr) {
  Error.captureStackTrace(this, constr || this);
  this.message = message || 'Exception';
};

util.inherits(AbstractException, Error);
AbstractException.prototype.name = 'AbstractException';

var CommonException = module.exports.CommonException = function (args) {
  this.name = "CommonException";
  this.err_code = null;
  this.err_msg = null;
  if (args) {
    if (args.err_code !== undefined && args.err_code !== null) {
      this.err_code = args.err_code;
    }
    if (args.err_msg !== undefined && args.err_msg !== null) {
      this.err_msg = args.err_msg;
    }
  }
  CommonException.super_.call(this, "CommonException", this.constructor)
};
util.inherits(CommonException, AbstractException);
CommonException.prototype.message = 'CommonException';


module.exports.buildCommonException = function (apiCode) {
  return new CommonException(apiCode);
};