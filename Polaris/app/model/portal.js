var request = require("request");
var config = require("../../conf");
var tclog = require('../libs/tclog.js');

/**
 * 同盾接口
 * @type {{mobileCheck: module.exports.mobileCheck}}
 */
module.exports = {

  /**
   * 短信验证码防刷策略
   * @param checkInfo
   * @returns {Promise}
   */
  mobileCheck: function(checkInfo) {
    return new Promise((function(resolve, reject) {
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
      if(!config.developMode) { //非开发模式
        request.post({url:config.portal.url, form:requestInfo}, function (e, r, body) {
          try {
            var result = JSON.parse(body);
            //发送短信验证码
            //更新redis中该手机号同盾分数;
            tclog.debug({traceNo: checkInfo.traceNo, msg:"同盾返回信息", body:body});
            resolve({status:true, score: result.final_score});
          } catch (e) {
            tclog.error({traceNo: checkInfo.traceNo, msg:"同盾接口错误", err:e, body:body});
            resolve({status:false});
          }
        });
      } else { //开发模式返回0分
        resolve({status:true, score: 0});
      }
    }));
  }
};