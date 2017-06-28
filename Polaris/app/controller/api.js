/**
 * @file api.js
 * @desc api控制器
 * @author bao
 * @date 2015/11/2
 */
var passportModel = require('../model/passport.js');
var captcha2Model = require('../model/captcha2.js');
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
    var traceNo = this.req.traceNo+"";
    var loginInfo = { //登录信息
      source: headerBody.source, sysCode: headerBody.syscode, traceNo: traceNo,
      credential: postBody.credential, password: postBody.password
    };
    //日志输出不包含密码信息
    tclog.notice({api:'/api/login', loginInfo: _.omit(loginInfo, 'password')});
    try {
      var passportUser = yield passportModel.login(loginInfo);
      var tokenNo = yield tokenModel.putToken(loginInfo, passportUser);
      var result = {access_token:tokenNo, user:passportUser,msg:'登录成功'};
      yield this.api({errorCode : "00000", errorMsg : "登录成功", data: result});
    } catch (err) { //500
      tclog.error({api:'/api/login', traceNo:traceNo, err:err});
      yield this.api({errorCode : err.err_code, errorMsg : err.err_msg});
    }
  },

  /**
   * 注册
   */
  register: function *() {
    var postBody = this.request.body;
    var headerBody = this.header;
    var sysCode = headerBody.syscode;
    var clientInfo_ = headerBody["x-client"];
    if(clientInfo_) {
      var clientInfo = JSON.parse(clientInfo_);
      if(clientInfo && clientInfo.app) {
        if(clientInfo.app == 'tc') {
          sysCode = "P2P";
        } else if(clientInfo.app == 'nj') {
          sysCode = "FINANCE";
        }
      }
    }
    var smsCaptcha = postBody.smsCaptcha; //短信验证码(语音)
    var traceNo = this.req.traceNo+"";
    var registerInfo = {
      source: headerBody.source, sysCode: sysCode, traceNo: traceNo,
      mobile: postBody.mobile, password: postBody.password
    };
    tclog.notice({api:'/api/register', registerInfo: _.omit(registerInfo, 'password')});
    try {
      //短信验证码是否正确
      var biz_type = captcha2Model.BIZ_TYPE.REGISTER;
      var validObj = {biz_type:biz_type, captcha:smsCaptcha, mobile:registerInfo.mobile};
      yield captcha2Model.validateSmsCaptcha(registerInfo.traceNo, validObj);
      //调用注册接口
      yield passportModel.register(registerInfo);
      captcha2Model.clearSmsCaptcha(traceNo, registerInfo.mobile, biz_type);//清除注册短信
      var loginInfo = { //登录信息
        source: headerBody.source, sysCode: sysCode, traceNo: traceNo,
        credential: postBody.mobile, password: postBody.password
      };
      //注册成功自动登录
      var passportUser = yield passportModel.login(loginInfo);
      var tokenNo = yield tokenModel.putToken(loginInfo, passportUser);
      var result = {access_token:tokenNo, user:passportUser,msg:'登录成功'};
      yield this.api({errorCode : "00000", errorMsg : "登录成功", data: result});
    } catch (err) {
      tclog.warn({api:'/api/register', traceNo:traceNo, err:err});
      yield this.api({errorCode : err.err_code, errorMsg : err.err_msg});
    }
  },

  login4Social: function*() {
    var postBody = this.request.body;
    var headerBody = this.header;
    var traceNo = this.req.traceNo + "";
    var socialType = postBody.socialType;
    var socialCode = postBody.socialCode;
    var appId = postBody.appId;
    try {
      var loginInfo = {
        source: headerBody.source, sysCode: headerBody.syscode, traceNo: traceNo,
        socialType: socialType, appId: appId, code: socialCode
      };
      //日志输出不包含密码信息
      tclog.notice({api: '/api/login', loginInfo: _.omit(loginInfo)});
      var passportUser = yield passportModel.login4Social(loginInfo);
      var tokenNo = yield tokenModel.putToken(loginInfo, passportUser);
      var result = {access_token: tokenNo, user: passportUser, msg: '登录成功'};
      yield this.api({errorCode : "00000", errorMsg : "登录成功", data: result});
    } catch (err) { //500
      tclog.error({api: '/api/login4Social', traceNo: traceNo, err: err});
      yield this.api({errorCode: err.err_code, errorMsg: err.err_msg});
    }
  },

  login4Sms: function*() {
    var headerBody = this.header;
    var postBody = this.request.body;
    var mobile = postBody.mobile;
    var smsCaptcha = postBody.smsCaptcha;
    var socialCode = postBody.socialCode;
    var traceNo = this.req.traceNo + "";
    try {
      var loginInfo = {
        source: headerBody.source, sysCode: headerBody.syscode, traceNo: traceNo,
        mobile: mobile, captcha: smsCaptcha, code: socialCode
      };
      var passportUser = yield passportModel.login4Sms(loginInfo);
      var tokenNo = yield tokenModel.putToken(loginInfo, passportUser);
      var result = {access_token: tokenNo, user: passportUser, msg: '登录成功'};
      yield this.api({errorCode : "00000", errorMsg : "登录成功", data: result});
    } catch (err) { //500
      tclog.error({api: '/api/login4Sms', traceNo: traceNo, err: err});
      yield this.api({errorCode: err.err_code, errorMsg: err.err_msg});
    }
  },

  /**
   * 安全退出
   */
  logout: function* () {
    var query = this.query;
    var headerBody = this.header;
    var traceNo = this.req.traceNo+"";
    var tokenNo = query.access_token;
    tclog.notice({api:'api/logout', traceNo:traceNo, source:headerBody.source, sysCode:headerBody.syscode, tokenNo: tokenNo});
    var tokenInfo = {
      source:headerBody.source,
      sysCode:headerBody.syscode,
      traceNo: traceNo,
      tokenNo: tokenNo
    };
    var result = yield tokenModel.removeToken(tokenInfo);
    tclog.notice({api:'/api/logout', traceNo:traceNo, result:result});
    yield this.api({errorCode : "00000", errorMsg : "退出成功", data: tokenNo});
  }
};
