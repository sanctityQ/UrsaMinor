require('should');
var rewire = require('rewire');
var sinon = require('sinon');
var app = rewire('../server');
var request = require('supertest-koa-agent')(app);
var test = require('../libs/test');
var ex_utils = require('../libs/exception.js');
var apiCode = require('../conf/apiCode');
var router = rewire('../router');
var _ = require('underscore');

var ctrs;
var captchaModel;
var passportModel;
var portalModel;

var userValidate_stub;
var getMobileCheck_stub;
var mobileCheck_stub;
var updateMobileCheck_stub;
var sendSmsCaptcha_stub;

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
  app.listen(80002);

  captchaModel = ctrs.captcha.__get__('captcha2Model');
  passportModel = ctrs.captcha.__get__('passportModel');
  portalModel = ctrs.captcha.__get__('portalModel');
});


describe("图片验证码测试", function () {
  it("生成图片验证码", function (done) {
    var stub = sinon.stub(captchaModel, "genImgCaptcha");
    stub.returns(new Promise(function (resolve, reject) {
      resolve({
                createTime: 1453121076415,
                ttl: 1800,
                token: '8a4440dd-c99c-4b57-9f7f-099db1d9807f',
                captcha: 'data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAJYAAAAyCAIAAAAx7rVNAAACMUlEQVR42u2bSZaDMAxEdf/L5Ij0ql8nAYNUKstDlx5LCJK+bU3EDsniYnKBEEqEUCKEQij5zwjt89rbT/fXJgi3ZGmRSwjX5jfIdhM/Jr8RHhBCNr9yJ6yJ8PX6u+ZEaNMifFeuWPV3bFcImS8PgVkS4ZDV50PI0SVq2uP9LeXb5gxF2Amqw2bay4kI/fBQkFYXIZIhzWEqZwkBv0JHGAFZjhDW2PcI5vxeCC2H0EfRivhZ7EjkIrSIQVsjZIVDTGP3/a3325cUI8QivYPinWqWlqb9UXUj93+78VnLNMV7hLx8bQDCptOiiw5AiKj16w5KXQikUgshfGCZs60NKLA1XWDoBRW0EdGqzaExzhKrKCJHpf+kLW2zzYYQ2N9NpduG4eTOm6oHS2fOkshLxyB8dNkjwsdnM/uEyfJI1xVdEHJ7aW0eZ4QB6oxzjhAy8/xKEaabnzcHbAgeP9WwiuSuGVlmR3haqu4SYMxAxWaTWYa9VwcItjDLZidC6M3WrivIdPuv+3yf0URcCmE08qfbt93n+6wm4hqxMD3dJpfdfnOAXHRqhDYGIdwLcxmIHdlRhBPVhXmoHfilEPYYbr+bMF1pz64UgU+eWi/3Kmj9h9tTN9gKERpjKNTx4wQgQStF2Lv+yiFMJWHcoURon1UjPDpn7nFLsA8kOOGQERdGIDzghMGNkCrISiMuU2yyXYdwEdnvnzxCKIS74BRCiRBKhFAIJUIoEUKJEAqhZE35AS9jSLddfJIOAAAAAElFTkSuQmCC'
              })
    }));
    request
        .get('/api/captcha/img')
        .set('syscode', 'FINANCE')
        .set('source', 'APP')
        .expect(200)
        .end(function (err, res) {
          stub.calledOnce.should.be.equal(true);
          res.statusCode.should.be.equal(200);
          res.body.should.have.property('token');
          res.body.should.have.property('captcha');
          res.body.should.have.property('ttl');
          res.body.should.have.property('createTime');

          stub.reset();
          done();
        });
  });
});

describe("发送验证码测试", function () {

  before(function() {
    userValidate_stub = sinon.stub(passportModel, "userValidate");
    getMobileCheck_stub = sinon.stub(captchaModel, "getMobileCheck");
    mobileCheck_stub = sinon.stub(portalModel, "mobileCheck");
    updateMobileCheck_stub = sinon.stub(captchaModel, "updateMobileCheck");
    sendSmsCaptcha_stub = sinon.stub(captchaModel, "sendSmsCaptcha");
  });

  it("注册发送验证码测试[短信成功发送]", function (done) {
    userValidate_stub.returns(new Promise(function(resolve, reject){
      resolve(true); //手机号未注册
    }));
    getMobileCheck_stub.returns(new Promise(function(resolve, reject){
      resolve({score: 0, count: 0}); //优质手机号
    }));
    mobileCheck_stub.returns(new Promise(function(resolve, reject){
      resolve({status: true, score: 6}); //优质手机号
    }));
    sendSmsCaptcha_stub.returns(new Promise(function(resolve, reject){
      resolve(true); //优质手机号
    }));
    var mobile = '15138695162';
    request
        .post('/api/captcha/sms/register')
        .send({mobile: mobile}) //登录信息
        .set('syscode', 'FINANCE')
        .set('source', 'APP')
        .expect(200)
        .end(function (err, res) {
          res.body.mobile.should.be.equal(mobile);
          done();
        });
  });

  it("注册发送验证码测试[手机号已注册]", function (done) {
    userValidate_stub.returns(new Promise(function(resolve, reject){
      reject(ex_utils.buildCommonException(apiCode.E20001)); //已存在的用户
    }));
    var mobile = '15138695162';
    request
        .post('/api/captcha/sms/register')
        .send({mobile: mobile}) //登录信息
        .set('syscode', 'FINANCE')
        .set('source', 'APP')
        .expect(500)
        .end(function (err, res) {
          res.body.error_code.should.be.equal(20001);
          done();
        });
  });

  it("注册发送验证码测试[手机号格式错误]", function (done) {
    userValidate_stub.returns(new Promise(function(resolve, reject){
      reject(ex_utils.buildCommonException(apiCode.E20002)); //已存在的用户
    }));
    var mobile = '133';
    request
        .post('/api/captcha/sms/register')
        .send({mobile: mobile}) //登录信息
        .set('syscode', 'FINANCE')
        .set('source', 'APP')
        .expect(500)
        .end(function (err, res) {
          res.body.error_code.should.be.equal(20002);
          done();
        });
  });

  it("找回密码发送验证码测试[语音成功发送]", function (done) {
    userValidate_stub.returns(new Promise(function(resolve, reject){
      reject(ex_utils.buildCommonException(apiCode.E20001)); //已存在的用户
    }));
    getMobileCheck_stub.returns(new Promise(function(resolve, reject){
      resolve({score: 0, count: 0}); //优质手机号
    }));
    mobileCheck_stub.returns(new Promise(function(resolve, reject){
      resolve({status: true, score: 6}); //优质手机号
    }));
    sendSmsCaptcha_stub.returns(new Promise(function(resolve, reject){
      resolve(true); //优质手机号
    }));
    var mobile = '15138695162';
    request
        .post('/api/captcha/sound/resetPassword')
        .send({mobile: mobile}) //登录信息
        .set('syscode', 'FINANCE')
        .set('source', 'APP')
        .expect(200)
        .end(function (err, res) {
          res.body.mobile.should.be.equal(mobile);
          done();
        });
  });

  it("错误的资源[无法匹配]", function (done) {
    var mobile = '15138695162';
    request
        .post('/api/captcha/sound/xxxxx')
        .send({mobile: mobile}) //登录信息
        .set('syscode', 'FINANCE')
        .set('source', 'APP')
        .expect(404)
        .end(function (err, res) {
          res.body.error_code.should.be.equal(404);
          done();
        });
  });

  afterEach(function() {
    userValidate_stub.reset();
    getMobileCheck_stub.reset();
    mobileCheck_stub.reset();
    updateMobileCheck_stub.reset();
    sendSmsCaptcha_stub.reset();
  });

  after(function() {
    userValidate_stub.restore();
    getMobileCheck_stub.restore();
    mobileCheck_stub.restore();
    updateMobileCheck_stub.restore();
    sendSmsCaptcha_stub.restore();
  });
});