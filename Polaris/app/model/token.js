var crypto = require("crypto");
var Redis = require("ioredis");
var tclog = require('../libs/tclog.js');
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
   * @param traceNo
   * @param loginResult
   * @returns {Promise}
   */
  putToken: function (traceNo, loginResult) {
    return new Promise(function (resolve, reject) {
      genTokenNo().then(function(tokenNo) {
        var client = new Redis(config.redis);
        var now = new Date().getTime();
        var access_token = {
          source: loginResult.source,
          sysCode: loginResult.sysCode,
          uid: loginResult.user.id,
          createTime: now,
          expireTime: now + DEFAULT_EXPIRE*1000
        };
        client.setex("passport:access_token:"+tokenNo, DEFAULT_EXPIRE, JSON.stringify(access_token), function(err, results) {
          if(err) {
            tclog.error({logid: traceNo, err: err});
            resolve(null);
          } else {
            if(client) {
              client.quit();
            }
            tclog.notice({logid: traceNo, access_token: access_token});
            resolve(tokenNo);
          }
        });

      }, function(err) {
        tclog.error({logid: traceNo, err: err});
        resolve(null);
      })
    })
  },

  removeToken: function (tokenNo) {
    return new Promise(function (resolve, reject) {
      var client = new Redis(config.redis);
      client.del("passport:access_token:"+tokenNo, function(err, results) {
        if(client) {
          client.quit();
        }
        if(err) {
          resolve({header: apiCode.E10001});
        } else {
          resolve({header: apiCode.SUCCESS});
        }
      })
    })
  }
}