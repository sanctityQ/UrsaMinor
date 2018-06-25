/**
 * @file user.js
 * @desc 用户模型
 * @author xiaoguang01
 * @date 2015/9/27
 */
var thrift = require('thrift');
var tclog = require('../libs/tclog.js');
var _ = require('underscore');
var client_factory = require("../libs/client_factory");
var user_types = client_factory.user_types;
var ttypes = user_types.ttypes;
var client = client_factory.user_client;
var request = require("request");
var config = require('../../conf/index');

module.exports = {
  //登陆
  findUserByPassportUser: function (id) {
    ///openapi/account
    return new Promise(function (resolve, reject) {
      tclog.notice({"passportId":id, msg:"findUserByPassportUser"});
      request.get({url: config.p2p_url + "/openapi/account/user?passportId=" + id}, function (e, r, body) {
        try {
          var result = JSON.parse(body);
          resolve(result.data.userId);
        } catch (e) {
          tclog.error({msg:"findUserByPassportUser error", err:e, body:body});
          resolve("");
        }
      });
    });
  },

  findUserByMobile: function(mobile) {
    return new Promise(function (resolve, reject) {
      client.findUserByMobile(mobile, function(err, response) {
        if(err) {
          resolve(null)
        } else {
          tclog.notice({user:response, msg:"findUserByMobile", mobile:mobile});
          resolve(response)
        }
      });
    });
  },

  /**
   * 校验身份信息
   * @param user
   * @param name
   * @param idNumber
   * @returns {boolean}
   */
  checkIdNumber: function(user, name, idNumber) {
    if(user && name && idNumber) {
      return user.name == name && user.idNumber && user.idNumber.toUpperCase() == idNumber.toUpperCase();
    } else {
      return false;
    }
  }
};
