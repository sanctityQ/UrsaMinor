var captchaModel = require('../model/captcha.js');
var passportModel = require('../model/passport.js');
var tclog = require('../libs/tclog.js');


module.exports = {

  /**
   * 图片验证码
   */
  genImg: function* () {
    var result = yield captchaModel.genImgCaptcha();
    yield this.api(result);
  },

  /**
   * (短信|语音)验证码
   */
  sendSms4Register: function* () {
    var postBody = this.request.body;
    var headerBody = this.header; //header信息
    var traceNo = this.req.traceNo+""; //日志ID
    var mobile = postBody.mobile; //手机号
    tclog.notice({api:'sendSms',traceNo:traceNo, mobile:mobile});
    try {
      //验证手机号是否可用
      var type = this.params.type;
      if(type == 'sms' || type == 'sound') { //短信类型
        var validateInfo = {
          source: headerBody.source || 'APP',
          sysCode: headerBody.syscode,
          traceNo: traceNo,
          name: 'MOBILE',
          value: mobile
        };
        var result = yield passportModel.userValidate(validateInfo);
        tclog.notice({traceNo:traceNo, validate_result:result});
        if(type == 'sms') {
          result = yield captchaModel.sendSms4Register(traceNo, mobile);
          tclog.notice({api:"/api/captcha/sms/register", traceNo:traceNo, result: result});
        } else {
          result = yield captchaModel.sendSound4Register(traceNo, mobile);
          tclog.notice({api:"/api/captcha/sound/register", traceNo:traceNo, result: result});
        }
        yield this.api({mobile:mobile, msg:'验证码发送成功'});
      } else { //资源不存在
        yield this.api_404();
      }
    } catch(err) {
      tclog.error({api:'/api/captcha/sms/register', traceNo:traceNo, err:err});
      yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
    }
  },

  /**
   * (短信|语音)验证码-找回密码
   */
  sendSms4ResetPassword: function* () {
    var postBody = this.request.body;
    var headerBody = this.header; //header信息
    var traceNo = this.req.traceNo+""; //日志ID
    var mobile = postBody.mobile; //手机号
    tclog.notice({api:'sendSms4ResetPassword',traceNo:traceNo, mobile:mobile});
    try {
      //验证手机号是否可用
      var type = this.params.type;
      if(type == 'sms' || type == 'sound') { //短信类型
        var userInfo = {
          source: headerBody.source || 'APP',
          sysCode: headerBody.syscode,
          traceNo: traceNo+"",
          name: 'MOBILE',
          value: mobile
        };
        //验证手机号是否已注册
        var passportUser = yield passportModel.userInfo(userInfo);
        tclog.notice({traceNo:traceNo, userId:passportUser.id});
        if(type == 'sms') { //短信
          var result = yield captchaModel.sendSms4ResetPassword(traceNo, mobile);
          tclog.notice({api:'/api/captcha/sms/resetPassword', traceNo:traceNo, result:result});
        } else { //语音
          var result = yield captchaModel.sendSound4ResetPassword(traceNo, mobile);
          tclog.notice({api:'/api/captcha/sound/resetPassword', traceNo:traceNo, result:result});
        }
        yield this.api({mobile:mobile, msg:'验证码发送成功'});
      } else { //资源不存在
        yield this.api_404();
      }
    } catch (err) {
      tclog.error({api:'/api/captcha/sms/resetPassword', traceNo:traceNo, err:err});
      yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
    }
  }

  ///**
  // * 语音验证码
  // */
  //sendSound4Register: function* () {
  //  var postBody = this.request.body;
  //  var headerBody = this.header;
  //  var traceNo = this.req.traceNo+"";
  //  var mobile = postBody.mobile;
  //  tclog.notice({api:'sendSound', traceNo:traceNo, mobile:mobile});
  //  var validateInfo = {
  //    source: headerBody.source || 'APP',
  //    sysCode: headerBody.syscode,
  //    traceNo: traceNo,
  //    name: 'MOBILE',
  //    value: mobile
  //  };
  //  try {
  //    //验证手机号是否可用
  //    var result = yield passportModel.userValidate(validateInfo);
  //    tclog.notice({traceNo:traceNo, validate_result:result});
  //    result = yield captchaModel.sendSound4Register(traceNo, mobile);
  //    tclog.notice({api:'/api/captcha/sound/register', traceNo:traceNo, result:result});
  //    yield this.api(result);
  //  } catch (err) {
  //    tclog.error({api:'/api/captcha/sound/register', traceNo:traceNo, err:err});
  //    yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
  //  }
  //},

  ///**
  // * 短信验证码-找回密码
  // */
  //sendSound4ResetPassword: function* () {
  //  var postBody = this.request.body;
  //  var headerBody = this.header; //header信息
  //  var traceNo = this.req.traceNo+""; //日志ID
  //  var mobile = postBody.mobile; //手机号
  //  tclog.notice({api:'sendSound4ResetPassword',traceNo:traceNo, mobile:mobile});
  //  var userInfo = {
  //    source: headerBody.source || 'APP',
  //    sysCode: headerBody.syscode,
  //    traceNo: traceNo+"",
  //    name: 'MOBILE',
  //    value: mobile
  //  };
  //  try {
  //    //验证手机号是否已注册
  //    var passportUser = yield passportModel.userInfo(userInfo);
  //    tclog.notice({traceNo: traceNo, userId: passportUser.id});
  //    var result = yield captchaModel.sendSound4ResetPassword(traceNo, mobile);
  //    tclog.notice({api:'/api/captcha/sound/resetPassword', traceNo:traceNo, result:result});
  //    yield this.api(result);
  //  } catch (err) {
  //    tclog.error({api:'/api/captcha/sound/resetPassword', traceNo:traceNo, err:err});
  //    yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
  //  }
  //}
};