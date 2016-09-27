var tclog = require('../libs/tclog.js');
var _ = require('underscore');
var client_factory = require("../libs/client_factory");
var ex_utils = require('../libs/exception.js');
var apiCode = require("../conf/ApiCode.js");
var interact_types = client_factory.interact_types.ttypes;
var interact_client = client_factory.interact_client;

var coupon_types = client_factory.coupon_types.ttypes;
var coupon_client = client_factory.coupon_client;

module.exports = {

  triggerInteract : function(interactType, userId, inviteCode, extVal) {
    tclog.notice({userId:userId, interactType:interactType, inviteCode:inviteCode});
    var action = new interact_types.InteractAction({
      activeType:interactType,
      activeValue:extVal,
      inviterCode:inviteCode,
      userId:userId
    });
    interact_client.interactActiveDeal(action, function(err, response) {
      if(err) {
        tclog.notice({msg:"triggerInteract error", userId:userId, interactType:interactType, error:err});
      } else {
        tclog.notice({msg:"triggerInteract success", userId:userId, interactType:interactType});
      }
    });
  },

  /**
   * 获取邀请信息
   * @param inviteCode
   * @returns {Promise}
   */
  findInviteInfoByUserKey : function (inviteCode) {
    return new Promise(function (resolve, reject) {
      interact_client.findInviteInfoByUserKey(inviteCode, function (err, response) {
        if(err) {
          tclog.warn({msg : "findInviteInfoByUserKey error", inviteCode: inviteCode, error: err});
          if(err.errorCode) {
            if(err.errorCode == '20101') { //用户不存在
              reject(ex_utils.buildCommonException(apiCode.E20018));
            } else { //无邀请权限
              reject(ex_utils.buildCommonException(apiCode.E20019));
            }
          } else {
            reject(ex_utils.buildCommonException(apiCode.E10001));
          }
        } else {
          resolve(response);
        }
      });
    });
  },

  /**
   * 自动发送优惠券
   * @param userId
   * @returns {Promise}
   */
  autoSendCoupon : function (userId) {
    //CouponSendScene REGISTER = 1 代表注册
    coupon_client.autoSendCoupon(1, userId, function (err, response) {
      if(err) {
        tclog.warn({msg : "autoSendCoupon error", error: err});
      } else {
        tclog.notice({msg : "autoSendCoupon success", userId: userId, response: response});
      }
    });
  }
};