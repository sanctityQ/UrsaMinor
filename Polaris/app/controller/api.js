/**
 * @file api.js
 * @desc api控制器
 * @author bao
 * @date 2015/11/2
 */
var passportModel = require('../model/passport.js');
var captchaModel = require('../model/captcha.js');
var apiCode = require("../conf/ApiCode.js");
var tclog = require('../libs/tclog.js');
var tokenModel = require('../model/token.js');
var _ = require('underscore');


module.exports = {

  /**
   * 登录
   */
  login: function *() {
    var postBody = this.request.body;
    var headerBody = this.header;
    var logid = this.req.logid+"";
    var loginInfo = { //登录信息
      source: headerBody.source || 'APP',
      sysCode: headerBody.syscode,
      traceNo: logid,
      credential: postBody.credential,
      password: postBody.password
    };
    //日志输出不包含密码信息
    tclog.notice({api:'/api/login', loginInfo: _.omit(loginInfo, 'password')});
    var loginResult = yield passportModel.login(loginInfo);
    var result = {header:loginResult.header};
    if(loginResult.header.err_code == apiCode.SUCCESS.err_code) {
      var tokenNo = yield tokenModel.putToken(logid, loginResult);
      result.access_token = tokenNo;
    }
    yield this.api(result);
  },

  /**
   * 注册
   */
  register: function *() {
    var postBody = this.request.body;
    var headerBody = this.header;
    var smsCaptcha = postBody.smsCaptcha; //短信验证码(语音)
    var logid = this.req.logid+"";
    var registerInfo = {
      source: headerBody.source || 'APP',
      sysCode: headerBody.syscode,
      traceNo: logid,
      mobile: postBody.mobile,
      password: postBody.password
    };
    tclog.notice({api:'/api/register', loginInfo: _.omit(registerInfo, 'password')});
    //短信验证码是否正确
    var result = yield captchaModel.validate4Register(registerInfo.traceNo, registerInfo.mobile, smsCaptcha);
    if(result.header.err_code == apiCode.SUCCESS.err_code) {
      //调用注册接口
      var registerResult = yield passportModel.register(registerInfo);
      result.header = registerResult.header;
      //注册成功自动登录
      if(registerResult.header.err_code == apiCode.SUCCESS.err_code) {
        var loginInfo = { //登录信息
          source: headerBody.source || 'APP',
          sysCode: headerBody.syscode,
          traceNo: logid,
          credential: postBody.mobile,
          password: postBody.password
        };
        var loginResult = yield passportModel.login(loginInfo);
        var tokenNo = yield tokenModel.putToken(logid, loginResult);
        result.access_token = tokenNo;
      }
    }
    yield this.api(result);
  },

  /**
   * 安全退出
   */
  logout: function* () {
    var query = this.query;
    var headerBody = this.header;
    var logid = this.req.logid+"";
    var tokenNo = query.access_token;
    tclog.notice({api:'api/logout', logid:logid, tokenNo: tokenNo});
    var result = yield tokenModel.removeToken(tokenNo);
    yield this.api(result);
  }
};
