var request = require("request");
var config = require("../../conf");
var tclog = require('../libs/tclog.js');
var captcha_utils = require("../libs/captcha_utils");
var client_factory = require("../libs/client_factory");
var redis_client = client_factory.redis_client;
var developMode = config.developMode;



/**
 * 分数变更&次数+1&发送时间更新
 * @param mobile
 * @param score
 */
function updateMobileCheck(mobile, checkObj) {
  tclog.debug({msg:"updateMobileCheck", mobile:mobile, score:checkObj.score});
  var key = captcha_utils.sms_captcha_check_key(mobile);
  checkObj.count = checkObj.count + 1; //更新次数
  redis_client.set(key, JSON.stringify(checkObj));
  var expire = new Date();
  expire.setHours(23, 59, 59, 999); //指定失效时间
  redis_client.pexpireat(key, expire.getTime());
}

/**
 * 同盾接口
 * @type {{mobileCheck: module.exports.mobileCheck}}
 */
module.exports = {

  /**
   * 短信验证码防刷策略(异步执行)
   * @param checkInfo
   * @param checkObj
   */
  mobileCheck: function(checkInfo, checkObj) {
    var requestInfo = {
      token_id: checkInfo.token_id,
      partner_code: config.portal.partner_code,
      secret_key: config.portal.secret_key,
      event_id: config.portal.events.phoneCheck,
      account_mobile: checkInfo.mobile,
      ip_address: checkInfo.ip,
      resp_detail_type:config.portal.resp_detail_type
    };
    tclog.debug({traceNo: checkInfo.traceNo, requestInfo:requestInfo});
    if(!developMode) { //非开发模式
      request.post({url:config.portal.url, form:requestInfo}, function (e, r, body) {
        try {
          var result = JSON.parse(body);
          //发送短信验证码
          //更新redis中该手机号同盾分数;
          tclog.debug({traceNo: checkInfo.traceNo, msg:"同盾返回信息", body:body});
          checkObj.score = result.final_score; //更新分数
        } catch (e) {
          tclog.error({traceNo: checkInfo.traceNo, msg:"同盾接口错误", err:e, body:body});
          checkObj.score = checkObj.score + 6; //分数+6
        }
        updateMobileCheck(checkInfo.mobile, checkObj); //更新redis值
      });
    } else { //开发模式返回0分
      updateMobileCheck(checkInfo.mobile, checkObj); //次数增加 分数不变
    }
  }
};