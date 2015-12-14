var captchaModel = require('../model/captcha.js');
var passportModel = require('../model/passport.js');
var apiCode = require("../conf/ApiCode.js");
var tclog = require('../libs/tclog.js');


module.exports = {

  /**
   * 图片验证码
   */
  sendImg: function* () {
    var result = yield captchaModel.genImgCaptcha();
    yield this.api(result);
  },

  /**
   * 短信验证码
   */
  sendSms4Register: function* () {
    var query = this.query;
    var headerBody = this.header; //header信息
    var logid = this.req.logid+""; //日志ID
    var mobile = query.mobile; //手机号
    tclog.notice({api:'sendSms',logid:logid, mobile:mobile});
    var validateInfo = {
      source: headerBody.source || 'APP',
      sysCode: headerBody.syscode,
      traceNo: logid+"",
      name: 'MOBILE',
      value: mobile
    };
    //验证手机号是否可用
    var result = yield passportModel.userValidate(validateInfo);
    if(result.header.err_code == apiCode.SUCCESS.err_code) {
      result = yield captchaModel.sendSms4Register(logid, mobile);
    }
    tclog.notice(result);
    yield this.api(result);
  },

  /**
   * 语音验证码
   */
  sendSound4Register: function* () {
    var query = this.query;
    var headerBody = this.header;
    var logid = this.req.logid+"";
    var mobile = query.mobile;
    tclog.notice({api:'sendSound', logid:logid, mobile:mobile});
    var validateInfo = {
      source: headerBody.source || 'APP',
      sysCode: headerBody.syscode,
      traceNo: logid+"",
      name: 'MOBILE',
      value: mobile
    };
    //验证手机号是否可用
    var result = yield passportModel.userValidate(validateInfo);
    if(result.header.err_code == apiCode.SUCCESS.err_code) {
      result = yield captchaModel.sendSound4Register(logid, mobile);
    }
    tclog.notice(result);
    yield this.api(result);
  },

  /**
   * 短信验证码-找回密码
   */
  sendSms4ResetPassword: function* () {
    var query = this.query;
    var headerBody = this.header; //header信息
    var logid = this.req.logid+""; //日志ID
    var mobile = query.mobile; //手机号
    tclog.notice({api:'sendSms4ResetPassword',logid:logid, mobile:mobile});
    var validateInfo = {
      source: headerBody.source || 'APP',
      sysCode: headerBody.syscode,
      traceNo: logid+"",
      name: 'MOBILE',
      value: mobile
    };
    //验证手机号是否可用
    var result = yield passportModel.userValidate(validateInfo);
    if(result.header.err_code == apiCode.E20001.err_code) {
      result = yield captchaModel.sendSms4ResetPassword(logid, mobile);
    } else {
      result.header = apiCode.E20010;
    }
    tclog.notice(result);
    yield this.api(result);
  },

  /**
   * 短信验证码-找回密码
   */
  sendSound4ResetPassword: function* () {
    var query = this.query;
    var headerBody = this.header; //header信息
    var logid = this.req.logid+""; //日志ID
    var mobile = query.mobile; //手机号
    tclog.notice({api:'sendSound4ResetPassword',logid:logid, mobile:mobile});
    var validateInfo = {
      source: headerBody.source || 'APP',
      sysCode: headerBody.syscode,
      traceNo: logid+"",
      name: 'MOBILE',
      value: mobile
    };
    //验证手机号是否可用
    var result = yield passportModel.userValidate(validateInfo);
    if(result.header.err_code == apiCode.E20001.err_code) {
      result = yield captchaModel.sendSound4ResetPassword(logid, mobile);
    } else {
      result.header = apiCode.E20010;
    }
    tclog.notice(result);
    yield this.api(result);
  }

}