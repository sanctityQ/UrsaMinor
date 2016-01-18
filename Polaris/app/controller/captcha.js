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
  return (sms_type == 'sms' || sms_type == 'sound') && (biz_type == 'register' || biz_type == 'resetPassword');
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
    yield this.api(result);
  },

  /**
   * 发送验证码
   * //TODO 图片验证码
   */
  sendSmsCaptcha: function* () {
    var postBody = this.request.body;
    var headerBody = this.header; //header信息
    var traceNo = this.req.traceNo + ""; //日志ID
    var mobile = postBody.mobile; //手机号
    var sms_type = this.params.type;
    var biz_type = this.params.biz;
    tclog.notice({api: 'sendSmsCaptcha', traceNo: traceNo, mobile: mobile});
    try {
      if (validateParam(sms_type, biz_type)) { //参数验证
        var valid_code;
        try{
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
        var checkResult = yield portalModel.mobileCheck(checkInfo); //调用同盾接口
        if(checkResult.status) { //调用成功更新同盾分数 次数+1
          captcha2Model.updateMobileCheck(mobileCheck, mobile, checkResult.score);
        } else { //调用失败加6分 次数+1
          captcha2Model.updateMobileCheck(mobileCheck, mobile, mobileCheck.score + 6);
        }
        var sendObj = {sms_type: sms_type, biz_type: biz_type, mobile: mobile};
        var result = yield captcha2Model.sendSmsCaptcha(traceNo, sendObj);
        tclog.notice({msg: "sendSmsCaptcha success", traceNo: traceNo, result: result});
        yield this.api({mobile: mobile, msg: '验证码发送成功'});
      } else { //资源不存在
        tclog.warn({traceNo:traceNo, sms_type:sms_type, biz_type:biz_type});
        yield this.api_404();
      }
    } catch (err) {
      tclog.warn({msg:'sendSmsCaptcha error', traceNo: traceNo, err: err});
      yield this.api_err({error_code: err.err_code, error_msg: err.err_msg});
    }
  }

  ///**
  // * (短信|语音)验证码
  // */
  //sendSms4Register: function* () {
  //  var postBody = this.request.body;
  //  var headerBody = this.header; //header信息
  //  var traceNo = this.req.traceNo+""; //日志ID
  //  var mobile = postBody.mobile; //手机号
  //  tclog.notice({api:'sendSms',traceNo:traceNo, mobile:mobile});
  //  try {
  //    //验证手机号是否可用
  //    var type = this.params.type;
  //    if(type == 'sms' || type == 'sound') { //短信类型
  //      var validateInfo = {
  //        source: headerBody.source || 'APP',
  //        sysCode: headerBody.syscode,
  //        traceNo: traceNo,
  //        name: 'MOBILE',
  //        value: mobile
  //      };
  //      var result = yield passportModel.userValidate(validateInfo);
  //      tclog.notice({traceNo:traceNo, validate_result:result});
  //      if(type == 'sms') {
  //        result = yield captchaModel.sendSms4Register(traceNo, mobile);
  //        tclog.notice({api:"/api/captcha/sms/register", traceNo:traceNo, result: result});
  //      } else {
  //        result = yield captchaModel.sendSound4Register(traceNo, mobile);
  //        tclog.notice({api:"/api/captcha/sound/register", traceNo:traceNo, result: result});
  //      }
  //      yield this.api({mobile:mobile, msg:'验证码发送成功'});
  //    } else { //资源不存在
  //      yield this.api_404();
  //    }
  //  } catch(err) {
  //    tclog.error({api:'/api/captcha/sms/register', traceNo:traceNo, err:err});
  //    yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
  //  }
  //},
  //
  ///**
  // * (短信|语音)验证码-找回密码
  // */
  //sendSms4ResetPassword: function* () {
  //  var postBody = this.request.body;
  //  var headerBody = this.header; //header信息
  //  var traceNo = this.req.traceNo+""; //日志ID
  //  var mobile = postBody.mobile; //手机号
  //  tclog.notice({api:'sendSms4ResetPassword',traceNo:traceNo, mobile:mobile});
  //  try {
  //    //验证手机号是否可用
  //    var type = this.params.type;
  //    if(type == 'sms' || type == 'sound') { //短信类型
  //      var userInfo = {
  //        source: headerBody.source || 'APP',
  //        sysCode: headerBody.syscode,
  //        traceNo: traceNo+"",
  //        name: 'MOBILE',
  //        value: mobile
  //      };
  //      //验证手机号是否已注册
  //      var passportUser = yield passportModel.userInfo(userInfo);
  //      tclog.notice({traceNo:traceNo, userId:passportUser.id});
  //      if(type == 'sms') { //短信
  //        var result = yield captchaModel.sendSms4ResetPassword(traceNo, mobile);
  //        tclog.notice({api:'/api/captcha/sms/resetPassword', traceNo:traceNo, result:result});
  //      } else { //语音
  //        var result = yield captchaModel.sendSound4ResetPassword(traceNo, mobile);
  //        tclog.notice({api:'/api/captcha/sound/resetPassword', traceNo:traceNo, result:result});
  //      }
  //      yield this.api({mobile:mobile, msg:'验证码发送成功'});
  //    } else { //资源不存在
  //      yield this.api_404();
  //    }
  //  } catch (err) {
  //    tclog.error({api:'/api/captcha/sms/resetPassword', traceNo:traceNo, err:err});
  //    yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
  //  }
  //}
};