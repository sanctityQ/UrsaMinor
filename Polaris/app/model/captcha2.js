var request = require("request");
var concat = require("concat-stream");
var ex_utils = require('../libs/exception.js');
var apiCode = require("../conf/ApiCode.js");
var config = require("../../conf/index.js");
var tclog = require('../libs/tclog.js');
var captcha_utils = require("../libs/captcha_utils");
var client_factory = require("../libs/client_factory");
var captcha_config = config.captcha;
var redis_client = client_factory.redis_client;
var sms_client = client_factory.sms_client;
var ttypes = client_factory.notification_types.sms_types;
var developMode = config.developMode;

var SMS_TYPE = {
  SMS: 'sms',
  SOUND: 'sound'
};

var BIZ_TYPE = {
  REGISTER: 'register',
  RESETPWD: 'resetPassword'
};

/**
 * 获取验证码
 * @param mobile 手机号
 * @param biz_type 业务类型(注册|找回密码)
 * @param flag 发送|校验
 * @returns {*}
 */
function getCaptcha(mobile, biz_type, flag) {
  return new Promise(function (resolve, reject) {
    var key;
    if (biz_type == BIZ_TYPE.REGISTER) { //注册
      key = captcha_utils.sms_captcha_register_key(mobile);
    } else { //找回密码
      key = captcha_utils.sms_captcha_resetpwd_key(mobile);
    }
    var captchaObj = {};
    redis_client.get(key, function(err, result) {
      captchaObj = result;
      if (flag) { //发送验证码
        var ttl = captcha_config.TTL; //验证码有效时间
        if (!captchaObj) { //不存在
          captchaObj = {
            sendTime: Date.now(), //创建时间
            captcha: captcha_utils.genCaptcha(),//验证码 6位数字
            checkCount: 0 //校验次数
          };
          redis_client.setex(key, ttl, JSON.stringify(captchaObj));//设置失效时间
          captchaObj.interval = true; //设置间隔标志,标示可以发送
        } else { //已存在
          captchaObj = JSON.parse(captchaObj);
          var now = Date.now();
          var interval = now - captchaObj.sendTime;
          if(interval > captcha_config.MIN_INTERVAL) { //时间间隔
            if(captchaObj.checkCount > captcha_config.MAX_VALID_COUNT) { //验证次数过多,生成新的验证码
              captchaObj.captcha = captcha_utils.genCaptcha();
            }
            captchaObj.sendTime = now; //重新设置发送时间
            captchaObj.checkCount = 0; //重新设置验证次数
            redis_client.setex(key, ttl, JSON.stringify(captchaObj));//重置失效时间
            captchaObj.interval = true; //设置间隔标志,标示可以发送
          } else {
            captchaObj.interval = false; //设置间隔标志,标示不能发送
          }
        }
        resolve(captchaObj);
      } else { //校验验证码
        if (captchaObj) { //如果captchaObj存在
          captchaObj = JSON.parse(captchaObj);
          captchaObj.checkCount = captchaObj.checkCount + 1; //更新校验次数
          redis_client.ttl(key, function(err, result) {
            if(result) {
              tclog.debug({key: key, "ttl:":result});
              redis_client.setex(key, result, JSON.stringify(captchaObj));
              captchaObj.limit = captchaObj.checkCount > 20;//超过最大验证限制,需要重新获取验证码
              resolve(captchaObj);
            } else {
              resolve(null);
            }
          });
        } else {
          resolve(null);
        }
      }
    });
  })
}

module.exports = {
  /**
   * 发送图面验证码
   * @returns {Promise}
   */
  genImgCaptcha: function () {
    return new Promise(function (resolve, reject) {
      request(captcha_config.img.server + captcha_config.img.path, {timeout: 3000})
          .on('error', function (err) {
            //图片验证码服务一次
            console.log(err);
            reject(ex_utils.buildCommonException(apiCode.E10001));
          }).on('response', function (response) {
        if (response.statusCode != 200) {
          tclog.error({msg:"img captcha server error"});
          reject(ex_utils.buildCommonException(apiCode.E10001));
        } else {
          var token = response.headers['x-captcha-token'];
          var answer = response.headers['x-captcha-answer'];
          var createTime = Date.now();
          var ttl = 1800; //失效时间
          var saveObj = { //保存到redis信息
            createTime: createTime,
            ttl: ttl,
            answer: answer
          };
          var key = captcha_utils.img_captcha_key(token);
          redis_client.setex(key, ttl, JSON.stringify(saveObj)); //保存验证码信息
          response.pipe(
              concat(function (data) {
                //图片信息转换成base64
                var captcha = "data:image/png;base64," + data.toString("base64");
                var resObj = { //接口返回信息
                  createTime: createTime,
                  ttl: ttl,
                  token: token,
                  captcha: captcha
                };
                resolve(resObj)
              })
          );
        }
      })
    })
  },

  /**
   * 验证图片验证码
   * @param token
   * @param captcha
   * @returns {Promise}
   */
  validateImgCaptcha: function (token, captcha) {
    return new Promise(function (resolve, reject) {
      if (token && captcha) { //验证数据有效性
        var key = captcha_utils.img_captcha_key(token);
        redis_client.get(key, function (err, result) {
          if (err) { //redis服务异常
            reject(ex_utils.buildCommonException(apiCode.E10001));
          } else {
            if (!developMode) { //非开发模式
              if (result) { //存在对应token验证码
                var img_captcha = JSON.parse(result);
                var answer = img_captcha.answer;
                redis_client.del(key); //只能验证一次
                if(answer.toUpperCase() == captcha.toUpperCase()) {
                  resolve(true);
                } else {
                  reject(ex_utils.buildCommonException(apiCode.E20014));
                }
              } else { //无效的token
                reject(ex_utils.buildCommonException(apiCode.E20014));
              }
            } else {//开发模式
              redis_client.del(key); //只能验证一次
              resolve(true);
            }
          }
        });
      } else { //参数不合法
        reject(ex_utils.buildCommonException(apiCode.E20098));
      }
    });
  },

  /**
   * 注册-短信验证码
   * @param traceNo
   * @param sendObj
   * @returns {Promise}
   */
  sendSmsCaptcha: function (traceNo, sendObj) {
    return new Promise(function (resolve, reject) {
      var mobile = sendObj.mobile; //手机号
      var sms_type = sendObj.sms_type; //验证码类型
      var biz_type = sendObj.biz_type; //业务类型
      tclog.debug({traceNo:traceNo, msg: "sendSmsCaptcha", sendObj: sendObj});

      getCaptcha(mobile, biz_type, true).then(function(captchaObj) {
        tclog.debug({traceNo:traceNo, msg: "sendSmsCaptcha", captchaObj: captchaObj});
        if(captchaObj.interval) { //大于最小发送间隔
          var captcha = captchaObj.captcha;
          //获取短信模板
          if (sms_type == SMS_TYPE.SMS) { //发送短信验证码
            var template;
            //判断业务类型
            if (biz_type == BIZ_TYPE.REGISTER) { //注册
              template = config.captcha.captcha_template.REGISTER;
            } else { //找回密码
              template = config.captcha.captcha_template.RESETPWD;
            }
            //通过模板生成短信内容
            var content = captcha_utils.genSmsContent({SMS_CAPTCHA: captcha}, template);
            tclog.notice({traceNo:traceNo, msg:'send sms captcha', mobile:mobile, content:content});
            if(!developMode) { //非开发模式
              var sendType = ttypes.SendType.TRIGGER;//发送类型及时发送
              sms_client.sendMessage(mobile, content, sendType, function(err, response) {
                if (err) {
                  tclog.error({traceNo: traceNo, msg:"sendSmsCaptcha error", err:err});
                  reject(ex_utils.buildCommonException(apiCode.E10001));
                } else {
                  if(response) {
                    resolve(response);
                  } else {
                    tclog.error({traceNo: traceNo, msg:"sendSmsCaptcha error", err:err});
                    reject(ex_utils.buildCommonException(apiCode.E20013));
                  }
                }
              });
            } else {
              resolve(true);
            }
          } else { //语音验证码
            tclog.notice({traceNo:traceNo, msg:"send voice captcha", mobile:mobile, captcha: captcha});
            if(!developMode) { //非开发模式
              sms_client.sendVoiceVerifyCode(mobile, captcha, function (err, response) {
                if (err) { //服务一次
                  tclog.error({traceNo:traceNo, msg:"sendSmsCaptcha error", err: err});
                  reject(ex_utils.buildCommonException(apiCode.E10001));
                } else {
                  if(response) {
                    resolve(response);
                  } else {
                    tclog.error({traceNo: traceNo, msg:"sendSmsCaptcha error", err:err});
                    reject(ex_utils.buildCommonException(apiCode.E20013));
                  }
                }
              });
            } else { //开发模式发送成功
              resolve(true);
            }
          }
        } else { //小于最小发送间隔
          reject(ex_utils.buildCommonException(apiCode.E20013)); //验证码发送失败
        }
      });
    });
  },

  /**
   * 验证(短信|语音)验证码
   * @param traceNo
   * @param validObj
   */
  validateSmsCaptcha: function(traceNo, validObj) {
    return new Promise(function (resolve, reject) {
      var mobile = validObj.mobile; //手机号
      var biz_type = validObj.biz_type; //业务类型
      var captcha = validObj.captcha;
      //获取验证码
      getCaptcha(mobile, biz_type, false).then(function(captchaObj) {
        if(captchaObj) {
          if(captchaObj.limit) { //验证次数限制
            reject(ex_utils.buildCommonException(apiCode.E20015)); //验证次数过多请重新发送
          } else {
            if(captcha == captchaObj.captcha) {
              resolve(true);
            } else {
              reject(ex_utils.buildCommonException(apiCode.E20006)); //验证码错误
            }
          }
        } else {
          reject(ex_utils.buildCommonException(apiCode.E20006)); //验证码错误
        }
      });
    })
  },

  /**
   * 获取验证码检验obj
   * @param mobile
   * @returns {*}
   */
  getMobileCheck: function (mobile) {
    return new Promise(function (resolve, reject) {
      var key = captcha_utils.sms_captcha_check_key(mobile);
      redis_client.get(key, function (err, checkObj) {
        tclog.debug({mobile:mobile, checkObj:checkObj});
        if (checkObj) { //如果第一次获取
          checkObj = JSON.parse(checkObj);
        } else {
          checkObj = {
            score: 0, //默认分数0
            count: 0 //次数0
          };
          redis_client.set(key, JSON.stringify(checkObj));
          var expire = new Date();
          expire.setHours(23, 59, 59, 999); //指定失效时间
          redis_client.pexpireat(key, expire.getTime());
        }
        resolve(checkObj);
      });
    })
  },

  /**
   * 分数变更&次数+1&发送时间更新
   * @param mobile
   * @param score
   */
  updateMobileCheck: function (checkObj, mobile, score) {
    tclog.debug({msg:"updateMobileCheck", mobile:mobile, score:score});
    var key = captcha_utils.sms_captcha_check_key(mobile);
    checkObj.score = score; //更新分数
    checkObj.count = checkObj.count + 1; //更新次数
    redis_client.set(key, JSON.stringify(checkObj));
    var expire = new Date();
    expire.setHours(23, 59, 59, 999); //指定失效时间
    redis_client.pexpireat(key, expire.getTime());
  },

  /**
   * 清除验证码信息
   * @param traceNo
   * @param mobile
   * @param biz_type
   */
  clearSmsCaptcha: function(traceNo, mobile, biz_type) {
    var key;
    if (biz_type == BIZ_TYPE.REGISTER) { //注册
      key = captcha_utils.sms_captcha_register_key(mobile);
    } else { //找回密码
      key = captcha_utils.sms_captcha_resetpwd_key(mobile);
    }
    redis_client.del(key); //清除验证码信息
  },

  SMS_TYPE: SMS_TYPE, //验证码类型 短信|语音
  BIZ_TYPE: BIZ_TYPE //业务类型  注册|找回密码
};