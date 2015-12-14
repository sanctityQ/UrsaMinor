require('should');
var rewire = require('rewire');
var sinon = require('sinon');
var app = rewire('../server');
var request = require('supertest-koa-agent')(app);
var test = require('../libs/test');
var apiCode = require('../conf/apiCode');
var router = rewire('../router');
var _ = require('underscore');

var ctrs;
before(function () {
  router.__set__({
                   getC: function (app) {
                     return new Promise(function (resovel, reject) {
                       try {
                         ctrs = test.getCtrs();
                         resovel(ctrs);
                       }
                       catch (e) {
                         reject(e);
                       }
                     });
                   }
                 });
  app.__set__({router: router});
  app.init();
  app.listen(8002);
});
var captchaModel;
var passportModel;
beforeEach(function () {
  captchaModel = _.clone(test.CAPTCHA_MODEL);
  passportModel = _.clone(test.PASSPORT_MODEL);
  ctrs.captcha.__set__({
                         captchaModel: captchaModel,
                         passportModel: passportModel
                       });
});

describe("captcha sendSms4Register test", function () {
  it("sendSms4Register success", function (done) {
    var sendSms4RegisterStub = sinon.stub(captchaModel, "sendSms4Register", function (logid, mobile) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS});
      });
    });
    var userValidateStub = sinon.stub(passportModel, "userValidate", function (validateInfo) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS});
      });
    });
    request
        .get('/api/captcha/sms/register?mobile=15138695162')
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = eval(res.body);
          result.should.have.property('header');
          result.header.should.have.eql(apiCode.SUCCESS);

          sinon.assert.calledOnce(userValidateStub);
          sinon.assert.calledOnce(sendSms4RegisterStub);
          done();
        });
  });
});

describe("captcha sendSound4Register test", function () {
  it("sendSound4Register success", function (done) {
    var sendSound4RegisterStub = sinon.stub(captchaModel, "sendSound4Register", function (logid, mobile) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS});
      });
    });
    var userValidateStub = sinon.stub(passportModel, "userValidate", function (validateInfo) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS});
      });
    });
    request
        .get('/api/captcha/sound/register?mobile=15138695162')
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = eval(res.body);
          result.should.have.property('header');
          result.header.should.have.eql(apiCode.SUCCESS);

          sinon.assert.calledOnce(userValidateStub);
          sinon.assert.calledOnce(sendSound4RegisterStub);
          done();
        });
  });
});

describe("captcha sendSms4ResetPassword test", function () {
  it("sendSound4Register success", function (done) {
    var sendSms4ResetPasswordStub = sinon.stub(captchaModel, "sendSms4ResetPassword", function (logid, mobile) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS});
      });
    });
    var userValidateStub = sinon.stub(passportModel, "userValidate", function (validateInfo) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.E20001});
      });
    });
    request
        .get('/api/captcha/sms/resetPassword?mobile=15138695162')
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = eval(res.body);
          result.should.have.property('header');
          result.header.should.have.eql(apiCode.SUCCESS);

          sinon.assert.calledOnce(userValidateStub);
          sinon.assert.calledOnce(sendSms4ResetPasswordStub);
          done();
        });
  });
});

describe("captcha sendSound4ResetPassword test", function () {
  it("sendSound4Register success", function (done) {
    var sendSound4ResetPasswordStub = sinon.stub(captchaModel, "sendSound4ResetPassword", function (logid, mobile) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS});
      });
    });
    var userValidateStub = sinon.stub(passportModel, "userValidate", function (validateInfo) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.E20001});
      });
    });
    request
        .get('/api/captcha/sound/resetPassword?mobile=15138695162')
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = eval(res.body);
          result.should.have.property('header');
          result.header.should.have.eql(apiCode.SUCCESS);

          sinon.assert.calledOnce(userValidateStub);
          sinon.assert.calledOnce(sendSound4ResetPasswordStub);
          done();
        });
  });
});