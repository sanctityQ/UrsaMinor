var request = require("request");
var concat = require("concat-stream");
var apiCode = require("../conf/ApiCode.js");
var config = require("../../conf").captcha;
var tclog = require('../libs/tclog.js');

//passport:REGISTER_IMG_CAPTCHA:[TOKEN]
//passport:REGISTER_CAPTCHA:[MOBILE]
//passport:REGISTER_SMS_CAPTCHA:[MOBILE]
//passport:REGISTER_SOUND_CAPTCHA:[MOBILE]
var randomNumber = new Array(0,1,2,3,4,5,6,7,8,9);//随机数

var random = new Array(0,1,2,3,4,5,6,7,8,9,'A','B','C','D','E','F','G','H','I','J','K','L','M','N','O','P','Q','R',
                       'S','T','U','V','W','X','Y','Z');//随机字符

//sms: 'http://192.168.0.244:8888/api/v2/users/smsCaptcha',
//sound: 'http://192.168.0.244:8888/api/v2/auth/soundcaptcha/send',
//valid: 'http://192.168.0.244:8888/api/v2/users/register/check/smscaptcha',
//sms4ResetPassword: 'http://192.168.0.244:8888/api/v2/users/smsCaptcha',
//valid4ResetPassword: 'http://192.168.0.244:8888/api/v2/users/smsCaptcha'
//[mobile]_CONFIRM_CREDITMARKET_REGISTER_CAPTCHA_MOBILE
//[mobile]_CONFIRM_CREDITMARKET_CHANGE_LOGIN_PASSWORD_CAPTCHA_MOBILE
/**
 * 生产验证码
 * @returns {string}
 */
//function genCaptcha() {
//  var code = "";
//  var codeLength = 6;//验证码的长度
//  for(var i = 0; i < codeLength; i++) {//循环操作
//    var index = Math.floor(Math.random()*10);//取得随机数的索引（0~35）
//    code += randomNumber[index];//根据索引取得随机数加到code上
//  }
//  return code;//把code值赋给验证码
//}

module.exports = {
  //发送图面验证码
  genImgCaptcha: function () {
    return new Promise(function (resolve, reject) {
      request(config.img.server+config.img.path, {timeout: 3000}).on('error', function (err) {
        console.log(err);
        //图片验证码服务一次
        resolve({header: apiCode.E10001});
      }).on('response', function (response) {
        var token = response.headers['x-captcha-token'];
        var answer = response.headers['x-captcha-answer'];
        var createTime = Date.now();
        var ttl = 1800;
        var saveObj = { //保存到redis信息
          createTime: createTime,
          ttl: ttl,
          answer: answer
        };
        //TODO saveObj 保存到 redis
        response.pipe(
            concat(function (data) {
              //图片信息转换成base64
              var captcha = "data:image/png;base64," + data.toString("base64");
              var resObj = { //接口返回信息
                header: apiCode.SUCCESS,
                createTime: createTime,
                ttl: ttl,
                token: token,
                captcha: captcha
              };
              resolve(resObj)
            })
        )
      })
    })
  },

  /**
   * 验证图片验证码
   */
  validateImgCaptcha: function(token, captcha) {
    return new Promise(function (resolve, reject) {

    })
  },

  /**
   * 注册-短信验证码
   */
  sendSms4Register: function(traceNo, mobile) {
    return new Promise(function (resolve, reject) {
      var url = config.sms.server + config.sms.path4Register + "?mobile="+mobile;
      request.get(url, {timeout: 3000}, function(e, r, body) {
        if(e) { //服务异常
          tclog.error({logid:traceNo, err:e});
          resolve({header: apiCode.E10001});
        } else {
          var result = JSON.parse(body);
          if(result.success) { //发送成功
            resolve({header: apiCode.SUCCESS});
          } else { //发送失败
            tclog.warn({logid:traceNo, result:body});
            resolve({header: apiCode.E20011});
          }
        }
      })
    })
  },

  /**
   * 注册-语音验证码
   */
  sendSound4Register: function(logid, mobile) {
    return new Promise(function (resolve, reject) {
      var url = config.sms.server + config.sms.path4Sound + "?mobile="+mobile+"&type=0";
      tclog.notice({logid:logid, url:url});
      request.get(url, {timeout: 10000}, function(e, r, body) {
        if(e) { //服务异常
          tclog.error({logid:logid, err:e}); //记录错误日志
          resolve({header: apiCode.E10001});
        } else {
          var result = JSON.parse(body);
          if(result.code == '1') {
            tclog.notice({logid:logid, result:body});
            resolve({header: apiCode.SUCCESS});
          } else {
            tclog.warn({logid:logid, result:body});
            resolve({header: apiCode.E20011});
          }
        }
      })
    })
  },

  /**
   * 注册-验证短信验证码
   */
  validate4Register: function(logid, mobile, captcha) {
    return new Promise(function (resolve, reject) {
      var url = config.sms.server + config.sms.path4ValidateRegister +"?mobile="+mobile+"&captcha="+captcha;
      request.get(url, {timeout: 2000}, function(e, r, body) {
        if(e) {
          tclog.error({logid:logid, err:e});
          resolve({header: apiCode.E10001})
        } else {
          if(body == 'true') {
            //[mobile]_CONFIRM_CREDITMARKET_REGISTER_CAPTCHA_MOBILE del
            resolve({header: apiCode.SUCCESS})
          } else {
            tclog.warn({logid:logid, result:body});
            resolve({header: apiCode.E20006})
          }
        }
      })
    })
  },

  /**
   * 找回密码-短信验证码
   */
  sendSms4ResetPassword: function(logid, mobile) {
    return new Promise(function (resolve, reject) {
      var url = config.sms.server + config.sms.path4ResetPassword + "/"+mobile;
      request.get(url, {timeout: 3000}, function(e, r, body) {
        if(e) { //服务异常
          tclog.error({logid:logid, err:e});
          resolve({header: apiCode.E10001});
        } else {
          if(body == 'true') {
            resolve({header: apiCode.SUCCESS});
          } else { //发送失败
            tclog.warn({logid:logid, result:body});
            resolve({header: apiCode.E20011});
          }
        }
      })
    })
  },

  /**
   * 找回密码-语音验证码
   */
  sendSound4ResetPassword: function(logid, mobile) {
    return new Promise(function (resolve, reject) {
      var url = config.sms.server + config.sms.path4Sound + "?mobile="+mobile+"&type=1";
      request.get(url, {timeout: 10000}, function(e, r, body) {
        if(e) { //服务异常
          tclog.error({logid:logid, err:e}); //记录错误日志
          resolve({header: apiCode.E10001});
        } else {
          var result = JSON.parse(body);
          if(result.code == '1') {
            resolve({header: apiCode.SUCCESS});
          } else {
            tclog.warn({logid:logid, result:body});
            resolve({header: apiCode.E20011});
          }
        }
      })
    })
  },

  /**
   * 找回密码-验证短信验证码
   */
  validate4ResetPassword: function(logid, mobile, captcha) {
    return new Promise(function (resolve, reject) {
      var url = config.sms.server + config.sms.path4ValidateResetPassword + "?mobile="+mobile+"&captcha="+captcha;
      request.get(url, {timeout: 2000}, function(e, r, body) {
        if(e) {
          tclog.error({logid:logid, err:e});
          resolve({header: apiCode.E10001})
        } else {
          if(body == 'true') {
            //[mobile]_CONFIRM_CREDITMARKET_CHANGE_LOGIN_PASSWORD_CAPTCHA_MOBILE del
            resolve({header: apiCode.SUCCESS})
          } else {
            tclog.warn({logid:logid, result:body});
            resolve({header: apiCode.E20006})
          }
        }
      })
    })
  }
}