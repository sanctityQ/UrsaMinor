var request = require("request");
var concat = require("concat-stream");
var ex_utils = require('../libs/exception.js');
var apiCode = require("../conf/ApiCode.js");
var app_config = require("../../conf");
var config = app_config.captcha;
var developMode = app_config.developMode;
var tclog = require('../libs/tclog.js');

module.exports = {

  /**
   * 注册-短信验证码
   */
  sendSms4Register: function (traceNo, mobile) {
    return new Promise(function (resolve, reject) {
      if (developMode) {
        resolve(true);
      } else {
        var url = config.sms.server + config.sms.path4Register + "?mobile=" + mobile;
        request.get(url, {timeout: 3000}, function (e, r, body) {
          if (e) { //服务异常
            tclog.error({traceNo: traceNo, err: e});
            reject(ex_utils.buildCommonException(apiCode.E10001));
          } else {
            var result = JSON.parse(body);
            if (result.success) { //发送成功
              resolve(true);
            } else { //发送失败
              tclog.warn({traceNo: traceNo, result: body});
              reject(ex_utils.buildCommonException(apiCode.E20013));
            }
          }
        });
      }
    })
  },

  /**
   * 注册-语音验证码
   */
  sendSound4Register: function (traceNo, mobile) {
    return new Promise(function (resolve, reject) {
      if (developMode) {
        resolve(true);
      } else {
        var url = config.sms.server + config.sms.path4Sound + "?mobile=" + mobile + "&type=0";
        tclog.notice({traceNo: traceNo, url: url});
        request.get(url, {timeout: 10000}, function (e, r, body) {
          if (e) { //服务异常
            tclog.error({traceNo: traceNo, err: e}); //记录错误日志
            reject(ex_utils.buildCommonException(apiCode.E10001));
          } else {
            var result = JSON.parse(body);
            if (result.code == '1') {
              tclog.notice({traceNo: traceNo, result: body});
              resolve(true);
            } else {
              tclog.warn({traceNo: traceNo, result: body});
              reject(ex_utils.buildCommonException(apiCode.E20013));
            }
          }
        });
      }
    })
  },

  /**
   * 注册-验证短信验证码
   */
  validate4Register: function (traceNo, mobile, captcha) {
    return new Promise(function (resolve, reject) {
      if (developMode) {
        resolve(true);
      } else {
        var url = config.sms.server + config.sms.path4ValidateRegister + "?mobile=" + mobile
                  + "&captcha=" + captcha;
        request.get(url, {timeout: 2000}, function (e, r, body) {
          if (e) {
            tclog.error({traceNo: traceNo, err: e});
            reject(ex_utils.buildCommonException(apiCode.E10001))
          } else {
            if (body == 'true') {
              //[mobile]_CONFIRM_CREDITMARKET_REGISTER_CAPTCHA_MOBILE del
              resolve(true);
            } else {
              tclog.warn({traceNo: traceNo, result: body});
              reject(ex_utils.buildCommonException(apiCode.E20006));
            }
          }
        });
      }
    })
  },

  /**
   * 找回密码-短信验证码
   */
  sendSms4ResetPassword: function (traceNo, mobile) {
    return new Promise(function (resolve, reject) {
      if (developMode) {
        resolve(true);
      } else {
        var url = config.sms.server + config.sms.path4ResetPassword + "/" + mobile;
        request.get(url, {timeout: 3000}, function (e, r, body) {
          if (e) { //服务异常
            tclog.error({traceNo: traceNo, err: e});
            reject(ex_utils.buildCommonException(apiCode.E10001));
          } else {
            if (body == 'true') {
              resolve(true);
            } else { //发送失败
              tclog.warn({traceNo: traceNo, result: body});
              reject(ex_utils.buildCommonException(apiCode.E20013));
            }
          }
        });
      }
    })
  },

  /**
   * 找回密码-语音验证码
   */
  sendSound4ResetPassword: function (traceNo, mobile) {
    return new Promise(function (resolve, reject) {
      if (developMode) {
        resolve(true);
      } else {
        var url = config.sms.server + config.sms.path4Sound + "?mobile=" + mobile + "&type=1";
        request.get(url, {timeout: 10000}, function (e, r, body) {
          if (e) { //服务异常
            tclog.error({traceNo: traceNo, err: e}); //记录错误日志
            reject(ex_utils.buildCommonException(apiCode.E10001));
          } else {
            var result = JSON.parse(body);
            if (result.code == '1') {
              resolve(true);
            } else {
              tclog.warn({traceNo: traceNo, result: body});
              reject(ex_utils.buildCommonException(apiCode.E20013));
            }
          }
        });
      }
    })
  },

  /**
   * 找回密码-验证短信验证码
   */
  validate4ResetPassword: function (traceNo, mobile, captcha) {
    return new Promise(function (resolve, reject) {
      if (developMode) {
        resolve(true);
      } else {
        var url = config.sms.server + config.sms.path4ValidateResetPassword + "?mobile=" + mobile
                  + "&captcha=" + captcha;
        request.get(url, {timeout: 2000}, function (e, r, body) {
          if (e) {
            tclog.error({traceNo: traceNo, err: e});
            reject(ex_utils.buildCommonException(apiCode.E10001));
          } else {
            if (body == 'true') {
              //[mobile]_CONFIRM_CREDITMARKET_CHANGE_LOGIN_PASSWORD_CAPTCHA_MOBILE del
              resolve(true);
            } else {
              tclog.warn({traceNo: traceNo, result: body});
              reject(ex_utils.buildCommonException(apiCode.E20006));
            }
          }
        });
      }
    })
  }
};