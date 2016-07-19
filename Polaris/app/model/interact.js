var tclog = require('../libs/tclog.js');
var _ = require('underscore');
var client_factory = require("../libs/client_factory");
var ex_utils = require('../libs/exception.js');
var apiCode = require("../conf/ApiCode.js");
var interact_types = client_factory.interact_types;
var ttypes = interact_types.ttypes;
var client = client_factory.interact_client;

module.exports = {

  triggerInteract : function(interactType, userId, inviteCode, extVal) {
    tclog.notice({userId:userId, interactType:interactType, inviteCode:inviteCode});
    var action = new ttypes.InteractAction({
      activeType:interactType,
      activeValue:extVal,
      inviterCode:inviteCode,
      userId:userId
    });
    client.interactActiveDeal(action, function(err, response) {
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
      client.findInviteInfoByUserKey(inviteCode, function (err, response) {
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
  }
};