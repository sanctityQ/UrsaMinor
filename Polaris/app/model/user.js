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

module.exports = {
  //登陆
  findUserByPassportUser: function (passportUser) {
    return new Promise(function (resolve, reject) {
      tclog.notice({"passportId":passportUser.id, msg:"findUserByPassportUser"})
      client.findUserByPassportId(passportUser.id, function(err, response) {
        if(err) {
          var userInit = new ttypes.UserInit({
            mobile: passportUser.mobile,
            loginName: passportUser.loginName,
            passportId:passportUser.id,
            source: passportUser.source,
            registerDate:passportUser.registerDate
          });
          client.initUser(userInit, function(err, response) {
            if(err) {
              reject(err)
            } else {
              resolve(response);
            }
          });
        } else {
          tclog.notice({user:response})
          resolve(response);
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
