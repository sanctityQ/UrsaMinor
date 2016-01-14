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
var ttypes = client_factory.notification_types.ttypes;

var SMS_TYPE = {
  SMS: 0,
  SOUND: 1
};

var BIZ_TYPE = {
  REGISTER: 0,
  RESETPWD: 1
};

/**
 * 获取验证码
 * @param mobile
 * @param biz_type
 * @param flag 发送|校验
 * @returns {*}
 */
function getCaptcha(mobile, biz_type, flag) {
  var key;
  if (biz_type == BIZ_TYPE.REGISTER) { //注册
    key = captcha_utils.sms_captcha_register_key(mobile);
  } else { //找回密码
    key = captcha_utils.sms_captcha_register_key(mobile);
  }
  var captchaObj = redis_client.get(key);
  if (flag) { //发送验证码
    var ttl = 10 * 60; //默认10分钟
    if (!captchaObj) { //不存在
      captchaObj = {
        sendTime: Date.now(), //创建时间
        captcha: captcha_utils.genCaptcha(), //验证码 6位数字
        checkCount: 0 //校验次数
      };
      redis_client.setex(key, ttl, JSON.stringify(captchaObj));
    } else { //已存在
      captchaObj = JSON.parse(captchaObj);
      captchaObj.sendTime = Date.now(); //重新设置发送时间
      redis_client.setex(key, ttl, JSON.stringify(captchaObj));//重置失效时间
    }
  } else { //校验验证码
    if (captchaObj) { //如果captchaObj存在
      captchaObj = JSON.parse(captchaObj);
      captchaObj.checkCount = captchaObj.checkCount + 1; //更新校验次数
      redis_client.set(key, JSON.stringify(captchaObj));
    }
  }
  return captchaObj;
}

module.exports = {
  //发送图面验证码
  genImgCaptcha: function () {
    return new Promise(function (resolve, reject) {
      request(captcha_config.img.server + captcha_config.img.path, {timeout: 3000})
          .on('error', function (err) {
            //图片验证码服务一次
            reject(ex_utils.buildCommonException(apiCode.E10001));
          }).on('response', function (response) {
        if (response.statusCode != 200) {
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
          redis_client.setex(key, ttl, JSON.stringify(saveObj));
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
   */
  validateImgCaptcha: function (token, captcha) {
    return new Promise(function (resolve, reject) {
      if (token && captcha) { //
        var key = captcha_config.redis_key.IMGCAPTCHA_PRE + token;
        redis_client.get(key, function (err, results) {
          if (err) { //redis服务异常
            reject(ex_utils.buildCommonException(apiCode.E10001));
          } else {
            if (!config.developMode) { //非开发模式
              if (results) { //存在对应token验证码
                var img_captcha = JSON.parse(results);
                var answer = img_captcha.answer;
                redis_client.del(key); //只能验证一次
                console.log(answer + "----" + captcha);
                resolve(answer.toUpperCase() == captcha.toUpperCase());
              } else { //无效的token
                reject(ex_utils.buildCommonException(apiCode.E20014));
              }
            } else {//开发模式
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
   */
  sendSmsCaptcha: function (traceNo, sendObj) {
    return new Promise(function (resolve, reject) {
      var mobile = sendObj.mobile; //手机号
      var sms_type = sendObj.sms_type; //验证码类型
      var biz_type = sendObj.biz_type; //业务类型
      var captchaObj = getCaptcha(mobile, biz_type, true);
      //TODO validate sendTime 发送间隔
      var captcha = captchaObj.captcha;
      //获取短信模板
      var sendType = ttypes.SendType.TRIGGER;//发送类型及时发送
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
        sms_client.sendMessage(mobile, content, sendType, function (err, response) {
          if (err) {
            reject(ex_utils.buildCommonException(apiCode.E10001));
          } else {
            console.log(response);
            resolve(true);
          }
        });
      } else { //语音验证码
        sms_client.sendVoiceVerifyCode(mobile, captcha, function (err, response) {
          if (err) {
            reject(ex_utils.buildCommonException(apiCode.E10001));
          } else {
            console.log(response);
            resolve(true);
          }
        });
      }

    });
  },

  /**
   * 获取验证码检验obj
   * @param mobile
   * @returns {*}
   */
  getMobileCheck: function (mobile) {
    var key = captcha_utils.sms_captcha_check_key(mobile);
    var checkObj = redis_client.get(key);
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
      client.pexpireat(key, expire.getTime());
    }
    return checkObj;
  },

  /**
   * 分数变更&次数+1&发送时间更新
   * @param mobile
   * @param score
   */
  updateMobileCheck: function (mobile, score) {
    var key = captcha_utils.sms_captcha_check_key(mobile);
    var checkObj = this.getMobileCheck(mobile);
    checkObj.score = score; //更新分数
    checkObj.count = checkObj.count + 1; //更新次数
    redis_client.set(key, JSON.stringify(checkObj));
  },

  SMS_TYPE: SMS_TYPE, //验证码类型 短信|语音
  BIZ_TYPE: BIZ_TYPE //业务类型  注册|找回密码
};