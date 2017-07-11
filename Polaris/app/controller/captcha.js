var passportModel = require('../model/passport.js');
var captcha2Model = require('../model/captcha2.js');
var portalModel = require('../model/portal.js');
var apiCode = require("../conf/ApiCode.js");
var ex_utils = require('../libs/exception.js');
var tclog = require('../libs/tclog.js');
var config = require("../../conf/index.js");
var MAX_SEND_COUNT = config.captcha.MAX_SEND_COUNT;

/**
 * 校验param
 * @param sms_type
 * @param biz_type
 * @returns {boolean}
 */
function validateParam(sms_type, biz_type) {
  return (sms_type == 'sms' || sms_type == 'sound') && (biz_type == 'register' || biz_type == 'resetPassword' || biz_type == 'login');
}

/**
 * 验证手机号
 * @param traceNo
 * @param mobile
 * @param biz_type
 * @param valid_code
 */
function validateMobile(traceNo, mobile, biz_type, valid_code) {
  tclog.debug({traceNo:traceNo, mobile:mobile, biz_type:biz_type, valid_code:valid_code});
  //验证手机号
  if(biz_type == 'register' && valid_code != apiCode.E20010) { //注册
    tclog.warn({traceNo:traceNo, msg:"register", mobile:mobile, valid_code: valid_code});
    throw ex_utils.buildCommonException(apiCode.E20001); //手机号已被使用
  }
  if(biz_type == 'resetPassword' && valid_code != apiCode.E20001) { //找回密码
    tclog.warn({traceNo:traceNo, msg:"resetPassword", mobile:mobile, valid_code: valid_code});
    throw ex_utils.buildCommonException(apiCode.E20010); //用户不存在
  }
}

module.exports = {

  /**
   * 图片验证码
   */
  genImg: function* () {
    var result = yield captcha2Model.genImgCaptcha();
    yield this.api({errorCode:"00000", errorMsg:"成功", data: result});
  },

  /**
   * 验证图片验证码
   */
  validateImg: function* () {
    var postBody = this.request.body;
    var headerBody = this.header; //header信息
    var traceNo = this.req.traceNo + ""; //日志ID
    var token = postBody.token; //图片验证码token
    var captcha = postBody.captcha; //图片验证码
    try {
      var result = yield captcha2Model.validateImgCaptcha(token, captcha, false);
      tclog.notice({msg: "validateImg success", traceNo: traceNo, result: result});
      yield this.api({errorCode:"00000", errorMsg:"验证通过", data: {token:token}});
    } catch (err) {
      tclog.warn({msg:'validateImg error', traceNo: traceNo, err: err});
      yield this.api({errorCode: err.err_code+"", errorMsg: err.err_msg});
    }
  },

  /**
   * 发送验证码
   *
   */
  sendSmsCaptcha: function* () {
    var postBody = this.request.body;
    var headerBody = this.header; //header信息
    var traceNo = this.req.traceNo + ""; //日志ID
    var mobile = postBody.mobile; //手机号
    var token = postBody.token; //图片验证码token
    var captcha = postBody.captcha; //图片验证码
    var sms_type = this.params.type;
    var biz_type = this.params.biz;
    tclog.notice({api: 'sendSmsCaptcha', traceNo: traceNo, mobile: mobile, biz_type:this.params.biz});
    try {
      if (validateParam(sms_type, biz_type)) { //参数验证
        var valid_code;
        try{
          yield captcha2Model.validateImgCaptcha(token, captcha, true);
          //验证
          var validateInfo = {source: headerBody.source, sysCode: headerBody.syscode,
            traceNo: traceNo, name: 'MOBILE', value: mobile};
          yield passportModel.userValidate(validateInfo);
          valid_code = apiCode.E20010; //手机号未使用
        } catch (err) {
          if(err.err_code && err.err_code == apiCode.E20001.err_code) {
            valid_code = apiCode.E20001; //手机号已使用
          } else {
            throw err; //(格式异常|服务异常)
          }
        }
        //验证手机号
        validateMobile(traceNo, mobile, biz_type, valid_code);
        var mobileCheck = yield captcha2Model.getMobileCheck(mobile);
        //(注册|找回)发送次数大于20 同盾分数大于60分
        if (mobileCheck.count > MAX_SEND_COUNT || mobileCheck.score > 60) {//TODO 可配置
          tclog.warn({traceNo:traceNo, mobile:mobile, count:mobileCheck.count, score:mobileCheck.score});
          throw ex_utils.buildCommonException(apiCode.E20016);
        }
        var checkInfo = {traceNo:traceNo, token_id: traceNo,  mobile: mobile, ip: this.ip};
        portalModel.mobileCheck(checkInfo, mobileCheck); //调用同盾接口 更新分数和次数
        var sendObj = {sms_type: sms_type, biz_type: biz_type, mobile: mobile};
        var result = yield captcha2Model.sendSmsCaptcha(traceNo, sendObj);
        tclog.notice({msg: "sendSmsCaptcha success", traceNo: traceNo, result: result});
        yield this.api({errorCode:"00000", errorMsg:"验证码发送成功", data: {mobile:mobile}});
      } else { //资源不存在
        tclog.warn({traceNo:traceNo, sms_type:sms_type, biz_type:biz_type});
        yield this.api_404();
      }
    } catch (err) {
      tclog.warn({msg:'sendSmsCaptcha error', traceNo: traceNo, err: err});
      var result = {errorCode: err.err_code+"", errorMsg: err.err_msg, data:{}};
      if(err.err_code == apiCode.E20013.err_code) {
        result.data.interval = err.interval;
      }
      yield this.api(result);
    }
  },

  /**
   *验证短信验证码(找回密码)
   */
  validateSms4ResetPassword: function* () {
    var postBody = this.request.body;
    var headerBody = this.header; //header信息
    var traceNo = this.req.traceNo + ""; //日志ID
    var mobile = postBody.mobile; //手机号
    var smsCaptcha = postBody.smsCaptcha; //短信验证码
    try {
      var biz_type = captcha2Model.BIZ_TYPE.RESETPWD;
      var validObj = {biz_type: biz_type, mobile: mobile, captcha: smsCaptcha};
      yield captcha2Model.validateSmsCaptcha(traceNo, validObj);
      yield this.api({errorCode:"00000", errorMsg:"验证通过", data: {mobile:mobile}});
    } catch (err) {
      tclog.warn({msg:'validateSms4ResetPassword error', traceNo: traceNo, err: err});
      yield this.api({errorCode: err.err_code+"", errorMsg: err.err_msg});
    }
  },

  /**
   *验证短信验证码(找回密码)
   */
  validateSms4Register: function* () {
    var postBody = this.request.body;
    var headerBody = this.header; //header信息
    var traceNo = this.req.traceNo + ""; //日志ID
    var mobile = postBody.mobile; //手机号
    var smsCaptcha = postBody.smsCaptcha; //短信验证码
    try {
      var biz_type = captcha2Model.BIZ_TYPE.REGISTER;
      var validObj = {
        source:headerBody.source, sysCode:headerBody.syscode,
        biz_type: biz_type, mobile: mobile, captcha: smsCaptcha
      };
      tclog.notice({traceNo: traceNo, msg: 'validateSms4Register', validObj: validObj});
      yield captcha2Model.validateSmsCaptcha(traceNo, validObj);
      yield this.api({errorCode:"00000", errorMsg:"验证通过", data: {mobile:mobile}});
    } catch (err) {
      tclog.warn({msg:'validate4Register error', traceNo: traceNo, err: err});
      yield this.api({errorCode: err.err_code+"", errorMsg: err.err_msg});
    }
  }

};