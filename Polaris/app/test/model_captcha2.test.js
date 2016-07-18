require("should");
var fs = require('fs');
var apiCode = require('../conf/ApiCode');
var conf = require("../../conf");
var sinon = require('sinon');
var rewire = require('rewire');
var nock = require('nock');
var test = require('../libs/test');
var captchaModel = rewire("../model/captcha2");
var captcha_utils = require("../libs/captcha_utils");
var config = require("../../conf/index.js");
var captcha_config = config.captcha;
var _ = require('underscore');

var redis_client;
var sms_client;
var sms_types;
before(function(){
  //覆盖tclog
  redis_client = captchaModel.__get__('redis_client');
  sms_client = captchaModel.__get__('sms_client');
  sms_types = captchaModel.__get__('ttypes');
  var tclog = captchaModel.__get__('tclog');
  tclog.init(true);
});

describe("图片验证码测试", function () {
  before(function() {
    captchaModel.__set__('developMode', false);
  });

  it("获取图片验证码[成功]", function (done) {
    var tokenNo = "66267be3-2c29-43df-81f5-875f99515ebd";
    var answer = "bgako";
    var key = captcha_utils.img_captcha_key(tokenNo);
    var ttl = 1800;
    var setex_stub = sinon.stub(redis_client, 'setex');
    nock(conf.captcha.img.server)
        .get(conf.captcha.img.path)
        .replyWithFile(200, __dirname + '/captcha.test.png', {
                         "Content-Type": "image/png",
                         "x-captcha-answer": answer,
                         "x-captcha-token": tokenNo
                       }
        );
    captchaModel.genImgCaptcha().then(function (data) {
      setex_stub.calledOnce.should.be.true; //answer存入redis
      setex_stub.calledWith(key, ttl, sinon.match(function(value){
        var obj = JSON.parse(value);
        return answer == obj.answer;
      })).should.be.true; //验证参数
      data.should.have.property('token').and.not.empty();
      data.should.have.property('captcha').and.not.empty();
      data.token.should.equal(tokenNo);
      data.captcha.should.equal('data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAAyCAIAAAAx7rVNAAACXElEQVR42u3bUXKEIBAEUO5/mT2iqVSyiZso9HQPCG5P+ZGqqEEeAyikbI7Fo7gKTOgwoeNKwsfj+7hr3fw/7kD4w7Y/TGhCE5rQhCY0oQlNaD8TmtCEJjThnQhp5rzGoVb++xIe/hYh4a7Cap6BiF4Jnpn0mN0Im35nBQ1dWL1VgY9MQuQ08BnjkFcQ/iklftXXhc+fCxegIk5I+X0WJK/j2XIUoxLNW1WfPyd0Qjb/fosgK3YgBM8E/V7vU7oFQyj7vfxdVjGbMNT3Rm5yXO/EZAfkbBIK85fTdnM9YUrHG8IT56sIZzc/iBB4ujzClLEzihecv1VSK9DZ4lPbUAqyiTiEMP6+AeGlEjabznF2bnkpyNbtdIS15g92vGd5hr8p7H7NT2yJFFydsF07rb9b4kcoW2OcRAquSwg17WrfW9iD/kwHcUZTcEVCsV8S/RTCaHaCXxTSCPNfmRU8gRA8AZ32AHeR/OYkRKW5PI7YjCHcF/hdCKWuuIffRmV0q8B8M718LMRHe+7ZRhNuJKHSTBf+OkPPRfN70RI5gf7UMo4wlPL0OhS2JDJuINw6J+LQlQp8sQJff2cXHemcySdUFIUlww6EKeu9yLKU8FFGJdQVkXbccclXIYzeB2vIUxNy1dV340VloM7dvqZ93W6+zh3XOb1rJlGx7/YncK7FFShjV2po8EJzUSfEIYMhEw6IpC2Xpcf+XvqmqZuerwi8xB32/6+wRXtyQnGL/l3/nXFJQuG7mmMmQmIDqmOKsTDltdJx8XBuwuUJo5/ZHJMSevJyH0KHCd8zPgAFm21phXexrAAAAABJRU5ErkJggg==');

      setex_stub.restore();
      done();
    })
  });

  it("获取图片验证码[服务异常]", function (done) {
    var setex_stub = sinon.stub(redis_client, 'setex');
    nock(conf.captcha.img.server)
        .get("/captcha")
        .reply(function (uri, requestBody) {
          return [500, 'THIS IS THE REPLY BODY'];
        });
    captchaModel.genImgCaptcha().then(function (data) {
    }, function(err) {
      sinon.assert.notCalled(setex_stub); //保存answer未执行
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E10001.err_code);

      setex_stub.restore();
      done();
    })
  });

  it("校验图片验证码[验证码正确]", function (done) {
    var tokenNo = "66267be3-2c29-43df-81f5-875f99515ebd";
    var captcha = "bgako";
    var key = captcha_utils.img_captcha_key(tokenNo);
    var del_stub = sinon.stub(redis_client, 'del');
    var get_stub = sinon.stub(redis_client, 'get', function(key, cb) {
      cb(null, '{"createTime":1453081988973,"ttl":1800,"answer":"bgako"}');
    });
    captchaModel.validateImgCaptcha(tokenNo, captcha, true).then(function (data) {
      sinon.assert.calledOnce(get_stub); //获取验证码执行一次
      del_stub.calledWith(key).should.be.true; //清除缓存执行一次
      data.should.be.true;

      del_stub.restore(); get_stub.restore();
      done();
    }, function(err) {
    })
  });

  it("校验图片验证码[验证码错误]", function (done) {
    var tokenNo = "66267be3-2c29-43df-81f5-875f99515ebd";
    var captcha = "bgako";
    var key = captcha_utils.img_captcha_key(tokenNo);
    var del_stub = sinon.stub(redis_client, 'del');
    var get_stub = sinon.stub(redis_client, 'get', function(key, cb) {
      cb(null, null);
    });
    captchaModel.validateImgCaptcha(tokenNo, captcha, true).then(function (data) {
    }, function(err) {
      sinon.assert.calledOnce(get_stub); //获取验证码执行一次
      sinon.assert.notCalled(del_stub);
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E20014.err_code);

      del_stub.restore(); get_stub.restore();
      done();
    })
  });

  it("校验图片验证码[参数错误]", function (done) {
    var tokenNo = "";
    var captcha = null;
    var del_stub = sinon.stub(redis_client, 'del');
    var get_stub = sinon.stub(redis_client, 'get');
    captchaModel.validateImgCaptcha(tokenNo, captcha, true).then(function (data) {
    }, function(err) {
      sinon.assert.notCalled(get_stub);
      sinon.assert.notCalled(del_stub);
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E20098.err_code);

      del_stub.restore(); get_stub.restore();
      done();
    })
  });

  it("校验图片验证码[开发模式]", function (done) {
    captchaModel.__set__('developMode', true); //设置开发模式
    var tokenNo = "66267be3-2c29-43df-81f5-875f99515ebd";
    var captcha = "AAAAA"; //随便填写
    var key = captcha_utils.img_captcha_key(tokenNo);
    var del_stub = sinon.stub(redis_client, 'del');
    var get_stub = sinon.stub(redis_client, 'get', function(key, cb) {
      cb(null, '{"createTime":1453081988973,"ttl":1800,"answer":"bgako"}');
    });
    captchaModel.validateImgCaptcha(tokenNo, captcha, true).then(function (data) {
      sinon.assert.calledOnce(get_stub); //获取验证码执行一次
      del_stub.calledWith(key).should.be.true; //清除缓存执行一次
      data.should.be.true;

      del_stub.restore(); get_stub.restore();
      done();
    }, function(err) {
    })
  });
});

describe("(短信|语音)验证码测试[开发模式]", function () {

  before(function() {
    //非开发模式
    captchaModel.__set__('developMode', true);
  });

  it("注册短信验证码[第一次发送]", function (done) {
    var sendObj = {mobile: '15138695162', sms_type : captchaModel.SMS_TYPE.SMS, biz_type : captchaModel.BIZ_TYPE.REGISTER};
    var key = captcha_utils.sms_captcha_register_key(sendObj.mobile);
    var get_stub = sinon.stub(redis_client, 'get', function(k, cb) {
      cb(null, null);
    });
    var setex_stub = sinon.stub(redis_client, 'setex');
    captchaModel.sendSmsCaptcha('a440f5e7-2eca-4f96-bc32-3391792f1ea1', sendObj).then(function(data) {
      sinon.assert.calledOnce(get_stub);
      setex_stub.calledWith(key, captcha_config.TTL, sinon.match(function(value){
        var obj = JSON.parse(value);
        return obj.captcha.length == 6 && obj.count == 0;
      })).should.be.true; //验证参数
      data.should.be.true; //发送成功

      get_stub.restore();
      setex_stub.restore();
      done();
    }, function(err) {
    });
  });

  it("注册短信验证码[重复发送]", function (done) {
    var sendObj = {mobile: '15138695162', sms_type : captchaModel.SMS_TYPE.SMS, biz_type : captchaModel.BIZ_TYPE.REGISTER};
    var key = captcha_utils.sms_captcha_register_key(sendObj.mobile);
    //发送时间为很早的一天,必定大于最小间隔
    var captchaObj = {"sendTime":1453081988973,"checkCount":0,"captcha":"666666"};
    var get_stub = sinon.stub(redis_client, 'get', function(k, cb) {
      if(k == key) {
        cb(null, JSON.stringify(captchaObj));
      }
    });
    var setex_stub = sinon.stub(redis_client, 'setex');
    captchaModel.sendSmsCaptcha('a440f5e7-2eca-4f96-bc32-3391792f1ea1', sendObj).then(function(data) {
      sinon.assert.calledOnce(get_stub);
      setex_stub.calledWith(key, captcha_config.TTL, sinon.match(function(value){
        var obj = JSON.parse(value);
        return captchaObj.captcha == obj.captcha && obj.count == 0;
      })).should.be.true; //验证参数
      data.should.be.true;

      get_stub.restore();
      setex_stub.restore();
      done();
    }, function(err) {
    });
  });

  it("找回密码语音验证码[验证次数过多,重置验证码]", function (done) {
    var sendObj = {mobile: '15138695162', sms_type : captchaModel.SMS_TYPE.SOUND, biz_type : captchaModel.BIZ_TYPE.RESETPWD};
    var key = captcha_utils.sms_captcha_resetpwd_key(sendObj.mobile); //找回密码key
    var captchaObj = {"sendTime":1453081988973,"checkCount":50,"captcha":"666666"};
    var get_stub = sinon.stub(redis_client, 'get', function(k, cb) {
      if(k == key) {
        cb(null, JSON.stringify(captchaObj));
      }
    });
    var setex_stub = sinon.stub(redis_client, 'setex');
    captchaModel.sendSmsCaptcha('a440f5e7-2eca-4f96-bc32-3391792f1ea1', sendObj).then(function(data) {
      setex_stub.calledWith(key, captcha_config.TTL, sinon.match(function(value){
        var obj = JSON.parse(value);
        return captchaObj.captcha == obj.captcha && obj.count == 0;
      })).should.be.true; //验证参数
      data.should.be.true;

      get_stub.restore();
      setex_stub.restore();
      done();
    }, function(err) {
    });
  });

  it("注册短信验证码[小于最小发送间隔]", function (done) {
    var sendObj = {mobile: '15138695162', sms_type : captchaModel.SMS_TYPE.SMS, biz_type : captchaModel.BIZ_TYPE.REGISTER};
    //设置发送时间为当前时间,模拟"小于最小发送间隔"
    var captchaObj = {"sendTime":Date.now(),"checkCount":0,"captcha":"666666"};
    var key = captcha_utils.sms_captcha_register_key(sendObj.mobile);
    var get_stub = sinon.stub(redis_client, 'get', function(k, cb) {
      if(k == key) {
        cb(null, JSON.stringify(captchaObj));
      }
    });
    captchaModel.sendSmsCaptcha('a440f5e7-2eca-4f96-bc32-3391792f1ea1', sendObj).then(function(data) {
    }, function(err) {
      sinon.assert.calledOnce(get_stub);
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E20013.err_code); //发送失败

      get_stub.restore();
      done();
    });
  });

  it("注册短信验证码[验证码正确]", function (done) {
    var validObj = {mobile: '15138695162', biz_type : captchaModel.BIZ_TYPE.REGISTER, captcha: '666666'};
    var key = captcha_utils.sms_captcha_register_key(validObj.mobile);
    var captchaObj = {"sendTime":Date.now(),"checkCount":0,"captcha":"666666"};
    var get_stub = sinon.stub(redis_client, 'get', function(k, cb) {
      cb(null, JSON.stringify(captchaObj));
    });
    var ttl_stub = sinon.stub(redis_client, 'ttl', function(k, cb) {
      if(k == key) {cb(null, 600);}
    });
    var setex_stub = sinon.stub(redis_client, 'setex');
    captchaModel.validateSmsCaptcha('a440f5e7-2eca-4f96-bc32-3391792f1ea1', validObj).then(function(data) {
      get_stub.calledWith(key).should.be.true;
      ttl_stub.calledWith(key, captcha_config.TTL, sinon.match.string).should.be.true;
      setex_stub.calledWith(key, sinon.match.func).should.be.true;
      data.should.be.true;

      get_stub.restore();
      ttl_stub.restore();
      setex_stub.restore();
      done();
    }, function(err) {});
  });

  it("找回密码语音验证码[验证码不正确]", function (done) {
    var validObj = {mobile: '15138695162', biz_type : captchaModel.BIZ_TYPE.RESETPWD, captcha: '666666'};
    var key = captcha_utils.sms_captcha_resetpwd_key(validObj.mobile);
    var get_stub = sinon.stub(redis_client, 'get', function(k, cb) {
      cb(null, null);
    });
    var ttl_stub = sinon.stub(redis_client, 'ttl');
    var setex_stub = sinon.stub(redis_client, 'setex');
    captchaModel.validateSmsCaptcha('a440f5e7-2eca-4f96-bc32-3391792f1ea1', validObj).then(function(data) {
    }, function(err) {
      get_stub.calledWith(key).should.be.true;
      sinon.assert.notCalled(ttl_stub);
      sinon.assert.notCalled(setex_stub);
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E20006.err_code); //发送失败

      get_stub.restore();
      ttl_stub.restore();
      setex_stub.restore();
      done();
    });
  });

  it("测试captcha_utils", function () {
    var captcha = captcha_utils.genCaptcha();
    captcha.length.should.be.equal(6);
    var captcha_obj = {'SMS_CAPTCHA' : captcha};
    var template = config.captcha.captcha_template.REGISTER;
    var content = captcha_utils.genSmsContent(captcha_obj, template);
    content.should.containEql(captcha_obj.SMS_CAPTCHA);
  });

  it("test date format", function () {
    console.log(Date.now())
  });
});

describe("(短信|语音)验证码测试[非开发模式]", function () {

  before(function() {
    //非开发模式
    captchaModel.__set__('developMode', false);
  });

  it("注册短信验证码[正常发送]", function (done) {
    var sendObj = {mobile: '15138695162', sms_type : captchaModel.SMS_TYPE.SMS, biz_type : captchaModel.BIZ_TYPE.REGISTER};
    var key = captcha_utils.sms_captcha_register_key(sendObj.mobile);
    var get_stub = sinon.stub(redis_client, 'get', function(k, cb) {
      cb(null, null);
    });
    var setex_stub = sinon.stub(redis_client, 'setex');
    var sendMessage_stub = sinon.stub(sms_client, "sendMessage", function(mobile, content, sendType, cb) {
      mobile.should.equal(sendObj.mobile);
      cb(null, true);
    });
    captchaModel.sendSmsCaptcha('a440f5e7-2eca-4f96-bc32-3391792f1ea1', sendObj).then(function(data) {
      sinon.assert.calledOnce(get_stub);
      setex_stub.calledWith(key, captcha_config.TTL, sinon.match(function(value){
        var obj = JSON.parse(value);
        return obj.captcha.length == 6 && obj.checkCount == 0;
      })).should.be.true; //验证参数
      sinon.assert.calledOnce(sendMessage_stub);
      data.should.be.true; //发送成功

      get_stub.restore();
      setex_stub.restore();
      sendMessage_stub.restore();
      done();
    }, function(err) {
    });
  });

  it("找回密码语音验证码[正常发送]", function (done) {
    var sendObj = {mobile: '15138695162', sms_type : captchaModel.SMS_TYPE.SOUND, biz_type : captchaModel.BIZ_TYPE.RESETPWD};
    var captchaObj = {"sendTime":1453081988973,"checkCount":0,"captcha":"666666"};
    var key = captcha_utils.sms_captcha_resetpwd_key(sendObj.mobile);
    var get_stub = sinon.stub(redis_client, 'get', function(k, cb) {
      cb(null, JSON.stringify(captchaObj));
    });
    var setex_stub = sinon.stub(redis_client, 'setex');
    var sendVoiceVerifyCode_stub = sinon.stub(sms_client, "sendVoiceVerifyCode", function(mobile, captcha, cb) {
      mobile.should.be.equal(sendObj.mobile);
      captcha.length.should.be.equal(6);
      cb(null, true);
    });
    captchaModel.sendSmsCaptcha('a440f5e7-2eca-4f96-bc32-3391792f1ea1', sendObj).then(function(data) {
      sinon.assert.calledOnce(get_stub);
      setex_stub.calledWith(key, captcha_config.TTL, sinon.match(function(value){
        var obj = JSON.parse(value);
        return obj.captcha.length == 6 && obj.checkCount == 0;
      })).should.equal(true);//验证参数
      sinon.assert.calledOnce(sendVoiceVerifyCode_stub);
      data.should.be.true; //发送成功

      get_stub.restore();
      setex_stub.restore();
      sendVoiceVerifyCode_stub.restore();
      done();
    }, function(err) {
    });
  });

});

describe("(短信|语音)验证码[手机号验证]", function () {

  it("获取验证信息[第一次获取]", function (done) {
    var mobile = '15138695162';
    var key = captcha_utils.sms_captcha_check_key(mobile);
    var get_stub = sinon.stub(redis_client, 'get', function(k, cb) {
      cb(null, null);
    });
    var set_stub = sinon.stub(redis_client, 'set');
    var pexpireat_stub = sinon.stub(redis_client, 'pexpireat');
    captchaModel.getMobileCheck(mobile).then(function(data){
      sinon.assert.calledOnce(get_stub);
      set_stub.calledWith(key, sinon.match(function(value){
        var obj = JSON.parse(value);
        obj.should.have.property('score');
        obj.should.have.property('count');
        return obj.score == 0 && obj.count == 0;
      })).should.equal(true);
      pexpireat_stub.calledWith(key, sinon.match.number).should.equal(true);
      data.should.have.property('score');
      data.should.have.property('count');

      get_stub.restore();
      set_stub.restore();
      pexpireat_stub.restore();
      done();
    });
  });

  it("获取验证信息[第n次获取]", function (done) {
    var mobile = '15138695162';
    var checkObj = { score: 20, count: 10 };
    var get_stub = sinon.stub(redis_client, 'get', function(k, cb) {
      cb(null, JSON.stringify(checkObj));
    });
    var set_stub = sinon.stub(redis_client, 'set');
    var pexpireat_stub = sinon.stub(redis_client, 'pexpireat');
    captchaModel.getMobileCheck(mobile).then(function(data){
      sinon.assert.calledOnce(get_stub);
      sinon.assert.notCalled(set_stub);
      sinon.assert.notCalled(pexpireat_stub);
      data.should.have.property('score');
      data.should.have.property('count');

      get_stub.restore();
      set_stub.restore();
      pexpireat_stub.restore();
      done();
    });
  });

  //it("更新验证信息[分数更新,次数+1]", function () {
  //  var mobile = '15138695162';
  //  var score = 30;
  //  var key = captcha_utils.sms_captcha_check_key(mobile);
  //  var checkObj = { score: 20, count: 10 };
  //  var set_spy = sinon.spy(redis_client, 'set');
  //  var pexpireat_spy = sinon.spy(redis_client, 'pexpireat');
  //  captchaModel.updateMobileCheck(checkObj, mobile, score);
  //  set_spy.calledWithMatch(sinon.match.same(key), sinon.match(function(value){
  //    var obj = JSON.parse(value);
  //    obj.should.have.property('score');
  //    obj.should.have.property('count');
  //    return obj.score == score && obj.count == 11;
  //  })).should.equal(true);//验证参数
  //  pexpireat_spy.calledWith(key, sinon.match.number).should.equal(true);
  //  set_spy.restore();
  //  pexpireat_spy.restore();
  //});

});