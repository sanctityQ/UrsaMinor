require("should");
var captchaModel = require("../model/captcha2");
var captcha_utils = require("../libs/captcha_utils");
var config = require("../../conf/index.js");

describe("图片验证码测试", function () {
  it("图片验证码[生成成功]", function (done) {
    captchaModel.genImgCaptcha().then(function(response) {
      console.log(response);
      done();
    }, function(err) {
      console.log(err);
      done();
    });
  });

  it("图片验证码[验证测试]", function (done) {
    captchaModel.validateImgCaptcha('a440f5e7-2eca-4f96-bc32-3391792f1ea1', '4apj7').then(function(response) {
      console.log(response);
      done();
    }, function(err) {
      console.log(err);
      done();
    });
  });

  it("测试captcha_utils", function () {
    var captcha = captcha_utils.genCaptcha();
    console.log(captcha.length)
    captcha.length.should.be.eq(6)
    var captcha_obj = {'SMS_CAPTCHA' : captcha};
    var template = config.captcha.captcha_template.REGISTER;
    var content = captcha_utils.genSmsContent(captcha_obj, template);
    console.log(content)
  });

  it("test date format", function () {
    console.log(Date.now())
  });
});
