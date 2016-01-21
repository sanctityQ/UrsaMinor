var test = module.exports = {};

test.NORMAL_USER = {

};

/**
 * PASSPORT_THRIFT_CLIENT
 * @type {{login: exports.PASSPORT_THRIFT_CLIENT.login, reg: exports.PASSPORT_THRIFT_CLIENT.reg, userValidate: exports.PASSPORT_THRIFT_CLIENT.userValidate}}
 */
test.PASSPORT_THRIFT_CLIENT = {
  login: function() {},
  reg: function() {},
  userValidate: function() {},
  resetPassword: function() {},
  changePassword: function() {}
};

/**
 * PASSPORT测试model
 * @type {{login: exports.PASSPORT_MODEL.login, register: exports.PASSPORT_MODEL.register, userValidate: exports.PASSPORT_MODEL.userValidate}}
 */
test.PASSPORT_MODEL = {
  login: function() {},
  register: function() {},
  userValidate: function() {}
};

/**
 * 验证码测试model
 * @type {{genImgCaptcha: exports.CAPTCHA_MODEL.genImgCaptcha, validateImgCaptcha: exports.CAPTCHA_MODEL.validateImgCaptcha, sendSms4Register: exports.CAPTCHA_MODEL.sendSms4Register, sendSound4Register: exports.CAPTCHA_MODEL.sendSound4Register, validate4Register: exports.CAPTCHA_MODEL.validate4Register, sendSms4ResetPassword: exports.CAPTCHA_MODEL.sendSms4ResetPassword, sendSound4ResetPassword: exports.CAPTCHA_MODEL.sendSound4ResetPassword, validate4ResetPassword: exports.CAPTCHA_MODEL.validate4ResetPassword}}
 */
test.CAPTCHA_MODEL = {
  genImgCaptcha: function() {},
  validateImgCaptcha: function() {},
  sendSms4Register: function() {},
  sendSound4Register: function() {},
  validate4Register: function() {},
  sendSms4ResetPassword: function() {},
  sendSound4ResetPassword: function() {},
  validate4ResetPassword: function() {}
};

test.TOKEN_MODEL = {
  putToken: function() {},
  removeToken: function() {}
};

test.tclog = {
  debug: function(data) {
    console.info(data);
  },
  notice: function (data) {
    console.info(data);
  },
  error: function (data) {
    console.error(data);
  },
  warn: function (data) {
    console.warn(data);
  }
};

test.redis_client = {
  set: function() {},
  setex: function() {}
};

var fs = require('fs');
var path = require('path');
var files = fs.readdirSync(__dirname + '/../controller/');
var rewire = require('rewire');

test.getCtrs = function(app) {
  var ctrs = {};
  files.forEach(function(file) {
    var stat  = fs.statSync(__dirname + '/../controller/' + file);
    if (!stat.isDirectory() && path.extname(file) === '.js') {
      var fileName = path.basename(file, '.js');
      var ctr = rewire(__dirname + '/../controller/' + file);
      ctrs[fileName] = ctr;
    }
  });
  return ctrs;
}