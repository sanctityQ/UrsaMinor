require("should");
var fs = require('fs');
var apiCode = require('../conf/apiCode');
var conf = require("../../conf");
var rewire = require('rewire');
var captchaModel = rewire("../model/captcha");
var nock = require('nock');

before(function () {
  captchaModel.__set__({
                         tclog: {
                           notice: function (data) {
                             console.log(data);
                             console.log("\r");
                           },
                           error: function (data) {
                             console.error(data);
                           },
                           warn: function (data) {
                             console.warn(data);
                           }
                         }
                       });

});

describe("发送短信注册验证码", function () {
  it("短信注册验证码[发送成功]", function (done) {
    var mobile = '15138695162';
    nock(conf.captcha.server)
        .get("/api/v2/users/smsCaptcha?mobile=" + mobile)
        .reply(200, {"data": mobile, "error": [], "success": true});
    captchaModel.sendSms4Register("1321312312", mobile).then(function (data) {
      data.should.have.property('header');
      data.header.should.eql(apiCode.SUCCESS);
      done();
    })
  });

  it("短信注册验证码[发送失败]", function (done) {
    var mobile = '15138695162';
    nock(conf.captcha.server)
        .get("/api/v2/users/smsCaptcha?mobile=" + mobile)
        .reply(200, {"data": "", "error": [], "success": false});
    captchaModel.sendSms4Register("1321312312", mobile).then(function (data) {
      data.should.have.property('header');
      data.header.should.eql(apiCode.E20011);
      done();
    })
  });

  it("短信注册验证码[服务异常]", function (done) {
    var mobile = '15138695162';
    nock(conf.captcha.server)
        .get("/api/v2/users/smsCaptcha?mobile=" + mobile)
        .socketDelay(10000)
        .reply(200, {});
    captchaModel.sendSms4Register("1321312312", mobile).then(function (data) {
      data.header.should.eql(apiCode.E10001);
      done();
    })
  });
});

describe("发送语音注册验证码", function () {
  it("发送语音注册验证码[发送成功]", function (done) {
    var mobile = '15138695162';
    nock(conf.captcha.server)
        .get("/api/v2/auth/soundcaptcha/send?mobile=" + mobile + "&type=0")
        .reply(200, {code: '1'});
    captchaModel.sendSound4Register("1321312312", mobile).then(function (data) {
      data.header.should.eql(apiCode.SUCCESS);
      done();
    })
  });

  it("发送语音注册验证码[发送失败]", function (done) {
    var mobile = '15138695162';
    nock(conf.captcha.server)
        .get("/api/v2/auth/soundcaptcha/send?mobile=" + mobile + "&type=0")
        .reply(200, {code: '0'});
    captchaModel.sendSound4Register("1321312312", mobile).then(function (data) {
      data.header.should.eql(apiCode.E20011);
      done();
    })
  });

  it("发送语音注册验证码[服务异常]", function (done) {
    var mobile = '15138695162';
    nock(conf.captcha.server)
        .get("/api/v2/auth/soundcaptcha/send?mobile=" + mobile + "&type=0")
        .socketDelay(10000)
        .reply(200, {code: '0'});
    captchaModel.sendSound4Register("1321312312", mobile).then(function (data) {
      data.header.should.eql(apiCode.E10001);
      done();
    })
  });
});

describe("验证注册验证码", function () {
  it("验证注册验证码[验证成功]", function (done) {
    var mobile = '15138695162';
    var captcha = '121212';
    nock(conf.captcha.server)
        .get("/api/v2/users/register/check/smscaptcha?mobile=" + mobile + "&captcha=" + captcha)
        .reply(200, 'true');
    captchaModel.validate4Register("1321312312", mobile, captcha).then(function (data) {
      data.header.should.eql(apiCode.SUCCESS);
      done();
    });
  });

  it("验证注册验证码[验证失败]", function (done) {
    var mobile = '15138695162';
    var captcha = '121212';
    nock(conf.captcha.server)
        .get("/api/v2/users/register/check/smscaptcha?mobile=" + mobile + "&captcha=" + captcha)
        .reply(200, 'false');
    captchaModel.validate4Register("1321312312", mobile, captcha).then(function (data) {
      data.header.should.eql(apiCode.E20006);
      done();
    });
  });

  it("验证注册验证码[服务异常]", function (done) {
    var mobile = '15138695162';
    var captcha = '121212';
    nock(conf.captcha.server)
        .get("/api/v2/users/register/check/smscaptcha?mobile=" + mobile + "&captcha=" + captcha)
        .socketDelay(10000)
        .reply(200, 'false');
    captchaModel.validate4Register("1321312312", mobile, captcha).then(function (data) {
      data.header.should.eql(apiCode.E10001);
      done();
    });
  });
});

describe("发送短信找回密码验证码", function () {
  it("发送短信找回密码验证码[发送成功]", function (done) {
    var mobile = '15138695162';
    nock(conf.captcha.server)
        .get("/api/v2/auth/resetpwd/smscaptcha/send/"+mobile)
        .reply(200, 'true');
    captchaModel.sendSms4ResetPassword("1321312312", mobile).then(function (data) {
      data.should.have.property('header');
      data.header.should.eql(apiCode.SUCCESS);
      done();
    })
  });

  it("发送短信找回密码验证码[发送失败]", function (done) {
    var mobile = '15138695162';
    nock(conf.captcha.server)
        .get("/api/v2/auth/resetpwd/smscaptcha/send/"+mobile)
        .reply(200, 'false');
    captchaModel.sendSms4ResetPassword("1321312312", mobile).then(function (data) {
      data.should.have.property('header');
      data.header.should.eql(apiCode.E20011);
      done();
    })
  });

  it("发送短信找回密码验证码[服务异常]", function (done) {
    var mobile = '15138695162';
    nock(conf.captcha.server)
        .get("/api/v2/auth/resetpwd/smscaptcha/send/"+mobile)
        .socketDelay(10000)
        .reply(200, {});
    captchaModel.sendSms4ResetPassword("1321312312", mobile).then(function (data) {
      data.header.should.eql(apiCode.E10001);
      done();
    })
  });
});

describe("发送语音找回密码验证码", function () {
  it("发送语音找回密码验证码[发送成功]", function (done) {
    var mobile = '15138695162';
    nock(conf.captcha.server)
        .get("/api/v2/auth/soundcaptcha/send?mobile=" + mobile + "&type=1")
        .reply(200, {code: '1'});
    captchaModel.sendSound4ResetPassword("1321312312", mobile).then(function (data) {
      data.header.should.eql(apiCode.SUCCESS);
      done();
    })
  });

  it("发送语音找回密码验证码[发送失败]", function (done) {
    var mobile = '15138695162';
    nock(conf.captcha.server)
        .get("/api/v2/auth/soundcaptcha/send?mobile=" + mobile + "&type=1")
        .reply(200, {code: '0'});
    captchaModel.sendSound4ResetPassword("1321312312", mobile).then(function (data) {
      data.header.should.eql(apiCode.E20011);
      done();
    })
  });

  it("发送语音找回密码验证码[服务异常]", function (done) {
    var mobile = '15138695162';
    nock(conf.captcha.server)
        .get("/api/v2/auth/soundcaptcha/send?mobile=" + mobile + "&type=1")
        .socketDelay(10000)
        .reply(200, {code: '0'});
    captchaModel.sendSound4ResetPassword("1321312312", mobile).then(function (data) {
      data.header.should.eql(apiCode.E10001);
      done();
    })
  });
});

describe("验证找回密码验证码", function () {
  it("验证找回密码验证码[验证成功]", function (done) {
    var mobile = '15138695162';
    var captcha = '121212';
    nock(conf.captcha.server)
        .get("/resetpwd/smscaptcha/check?mobile="+mobile+"&captcha="+captcha)
        .reply(200, 'true');
    captchaModel.validate4ResetPassword("1321312312", mobile, captcha).then(function (data) {
      data.header.should.eql(apiCode.SUCCESS);
      done();
    });
  });

  it("验证找回密码验证码[验证失败]", function (done) {
    var mobile = '15138695162';
    var captcha = '121212';
    nock(conf.captcha.server)
        .get("/resetpwd/smscaptcha/check?mobile="+mobile+"&captcha="+captcha)
        .reply(200, 'false');
    captchaModel.validate4ResetPassword("1321312312", mobile, captcha).then(function (data) {
      data.header.should.eql(apiCode.E20006);
      done();
    });
  });

  it("验证找回密码验证码[服务异常]", function (done) {
    var mobile = '15138695162';
    var captcha = '121212';
    nock(conf.captcha.server)
        .get("/resetpwd/smscaptcha/check?mobile="+mobile+"&captcha="+captcha)
        .socketDelay(10000)
        .reply(200, 'false');
    captchaModel.validate4ResetPassword("1321312312", mobile, captcha).then(function (data) {
      data.header.should.eql(apiCode.E10001);
      done();
    });
  });
});

describe("获取图片验证码", function () {
  it("获取图片验证码[成功]", function (done) {
    nock(conf.captcha.img)
        .get("/captcha")
        .replyWithFile(200, __dirname+'/captcha.test.png', {
                 "Content-Type": "image/png",
                 "x-captcha-answer": "bgako",
                 "x-captcha-token": "66267be3-2c29-43df-81f5-875f99515ebd"
               }
        );
    captchaModel.genImgCaptcha().then(function (data) {
      data.should.have.property('header');
      data.should.have.property('token').and.not.empty();
      data.should.have.property('captcha').and.not.empty();
      data.header.should.eql(apiCode.SUCCESS);
      data.token.should.equal('66267be3-2c29-43df-81f5-875f99515ebd');
      done();
    })
  });


  //it("获取图片验证码[服务异常]", function (done) {
  //  nock(conf.captcha.img)
  //      .get("/captcha")
  //      .reply(500, "err");
  //  captchaModel.genImgCaptcha().then(function (data) {
  //    console.log(data);
  //    data.should.have.property('header');
  //    data.header.should.eql(apiCode.E10001);
  //    done();
  //  })
  //});
});