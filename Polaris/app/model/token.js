var crypto = require("crypto");
var tclog = require('../libs/tclog.js');
var ex_utils = require('../libs/exception.js');
var apiCode = require("../conf/ApiCode.js");
var client_factory = require("../libs/client_factory");
var redis_client = client_factory.redis_client;
var passportTypes = client_factory.passport_types.ttypes;
var config = require('../../conf/index');
var token_config = config.token;
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
        var now = new Date().getTime();
        var access_token = {
          source: passportTypes.Source[loginIno.source],
          sysCode: passportTypes.SysCode[loginIno.sysCode],
          uid: passportUser.id,
          createTime: now,
          expireTime: now + token_config.DEFAULT_EXPIRE*1000
        };
        var key = token_config.KEY_PRE+tokenNo;
        redis_client.setex(key, token_config.DEFAULT_EXPIRE, JSON.stringify(access_token), function(err, result) {
          if(err) {
            tclog.error({traceNo: traceNo, msg:"putToken error", err: err});
            reject(ex_utils.buildCommonException(apiCode.E10001));
          } else {
            tclog.debug({traceNo: traceNo, msg:"putToken success", access_token: access_token, result:result});
            resolve(tokenNo);
          }
        });
      }, function(err) {
        tclog.error({traceNo: traceNo, msg:"gen tokenNo error", err: err});
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
      var key = token_config.KEY_PRE+tokenNo;
      redis_client.get(key, function(err, result) {
        if(err) {
          tclog.error({traceNo:traceNo, tokenNo:tokenNo, err_msg:"getToken error", err:err});
          reject(ex_utils.buildCommonException(apiCode.E10001));
        } else {
          if(result) { //token有效
            redis_client.expire(key, token_config.DEFAULT_EXPIRE);//重置失效时间
            var token = JSON.parse(result);
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
      redis_client.del(token_config.KEY_PRE+tokenInfo.tokenNo, function(err, result) {
        if(err) {
          tclog.error({tokenNo:tokenInfo.tokenNo, traceNo:tokenInfo.traceNo, err_msg:"removeToken error", err:err});
        }
        tclog.debug({msg:"removeToken count:"+result});
        resolve(true);
      })
    });
  }
}