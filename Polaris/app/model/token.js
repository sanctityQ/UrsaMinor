var crypto = require("crypto");
var Redis = require("ioredis");
var tclog = require('../libs/tclog.js');
var ex_utils = require('../libs/exception.js');
var apiCode = require("../conf/ApiCode.js");
var config = require('../../conf/index');
var DEFAULT_EXPIRE = 7*24*60*60;
/**
 * 生成tokenNo
 * @returns {Promise}
 */
function genTokenNo() {
  return new Promise(function (resolve, reject) {
    var salt = new Buffer(crypto.randomBytes(256)).toString('hex');
    crypto.pbkdf2('itiancai!access@token#key', salt, 7000, 32, function (err, hash) {
      if(err) {
        reject(err);
      } else {
        resolve(new Buffer(hash).toString('hex'));
      }
    });
  })
}

module.exports = {

  /**
   * 登录成功，redis缓存token信息
   * @param loginIno
   * @param passportUser
   * @returns {Promise}
   */
  putToken: function (loginIno, passportUser) {
    var traceNo = loginIno.traceNo;
    return new Promise(function (resolve, reject) {
      genTokenNo().then(function(tokenNo) {
        var client = new Redis(config.redis);
        var now = new Date().getTime();
        var access_token = {
          source: loginIno.source,
          sysCode: loginIno.sysCode,
          uid: passportUser.id,
          createTime: now,
          expireTime: now + DEFAULT_EXPIRE*1000
        };
        client.setex("passport:access_token:"+tokenNo, DEFAULT_EXPIRE, JSON.stringify(access_token), function(err, results) {
          if(client) {
            client.quit();
          }
          if(err) {
            tclog.error({traceNo: traceNo, err_msg:"putToken error", err: err});
            reject(ex_utils.buildCommonException(apiCode.E10001));
          } else {
            tclog.notice({traceNo: traceNo, access_token: access_token});
            resolve(tokenNo);
          }
        });

      }, function(err) {
        tclog.error({traceNo: traceNo, err_msg:"gen tokenNo error", err: err});
        reject(ex_utils.buildCommonException(apiCode.E10001));
      });
    })
  },

  /**
   * 获取token信息
   * @param tokenNo
   * @returns {Promise}
   */
  getToken: function (traceNo, tokenNo) {
    return new Promise(function (resolve, reject) {
      var client = new Redis(config.redis);
      client.get("passport:access_token:"+tokenNo, function(err, results) {
        if(client) {
          client.quit();
        }
        if(err) {
          tclog.error({traceNo:traceNo, tokenNo:tokenNo, err_msg:"getToken error", err:err});
          reject(ex_utils.buildCommonException(apiCode.E10001));
        } else {
          if(results) { //token有效
            var token = JSON.parse(results);
            resolve(token);
          } else { //token失效
            reject(ex_utils.buildCommonException(apiCode.E20099));
          }
        }
      })
    });
  },

  /**
   * 移除token
   * @param tokenInfo
   * @returns {Promise}
   */
  removeToken: function (tokenInfo) {
    return new Promise(function (resolve, reject) {
      var client = new Redis(config.redis);
      client.del("passport:access_token:"+tokenInfo.tokenNo, function(err, results) {
        if(client) {
          client.quit();
        }
        if(err) {
          tclog.error({tokenNo:tokenInfo.tokenNo, traceNo:tokenInfo.traceNo, err_msg:"removeToken error", err:err});
        }
        resolve(true);
      })
    });
  }
}