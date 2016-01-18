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
var portalModel;
beforeEach(function () {
  captchaModel = ctrs.captcha.__get__('captcha2Model');
  passportModel = ctrs.captcha.__get__('passportModel');
  portalModel = ctrs.captcha.__get__('portalModel');
});

describe("图片验证码测试", function () {
  it("生成图片验证码", function (done) {
    var spy = sinon.spy(captchaModel, "genImgCaptcha");
    request
        .get('/api/captcha/img')
        .set('syscode', 'FINANCE')
        .set('source', 'APP')
        .expect(200)
        .end(function (err, res) {
          spy.calledOnce.should.be.equal(true);
          res.statusCode.should.be.equal(200);
          res.body.should.have.property('token');
          res.body.should.have.property('captcha');
          res.body.should.have.property('ttl');
          res.body.should.have.property('createTime');
          done();
        });
  });
});

describe("发送验证码测试", function () {
  it("发送验证码测试[短信成功发送]", function (done) {
    var getMobileCheck_stub = sinon.stub(captchaModel, "getMobileCheck");
    var getMobileCheck_stub = sinon.stub(portalModel, "getMobileCheck");
    var spy = sinon.spy(captchaModel, "getMobileCheck");
    request
        .get('/api/captcha/sms/register')
        .set('syscode', 'FINANCE')
        .set('source', 'APP')
        .expect(200)
        .end(function (err, res) {

          done();
        });
  });
});