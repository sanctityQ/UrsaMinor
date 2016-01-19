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
var passportModel;
var captchaModel;
var tokenModel;

var getToken_stub;
var checkPassword_stub;
var resetPassword_stub;
var changePassword_stub;
var validateSmsCaptcha_stub;
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
  app.listen(80004);
  passportModel = ctrs.password.__get__('passportModel');
  captchaModel = ctrs.password.__get__('captcha2Model');
  tokenModel = ctrs.password.__get__('tokenModel');
});

var mobile = '15138695162';
var access_token = 'xxxxxxxx';
describe("安全保护", function () {

  before(function() {
    getToken_stub = sinon.stub(tokenModel, 'getToken');
    checkPassword_stub = sinon.stub(passportModel, 'checkPassword');
    resetPassword_stub = sinon.stub(passportModel, 'resetPassword');
    changePassword_stub = sinon.stub(passportModel, 'changePassword');
    validateSmsCaptcha_stub = sinon.stub(captchaModel, 'validateSmsCaptcha');
  });

  it("验证原始密码[验证通过]", function (done) {
    getToken_stub.returns(new Promise(function(resolve, reject) {
      resolve({uid:32});
    }));
    checkPassword_stub.returns(new Promise(function(resolve, reject) {
      resolve(true);
    }));
    request
        .post('/api/password/check')
        .send({access_token: access_token, oldPassword: '123456'})
        .set('syscode', 'FINANCE')//header info
        .set('source', 'APP')//header info
        .expect(200)
        .end(function (err, res) {
          var result = res.body;
          result.should.have.property('access_token');
          result.access_token.should.be.equal(access_token);
          done();
        });
  });

  it("修改密码[修改成功]", function (done) {
    getToken_stub.returns(new Promise(function(resolve, reject) {
      resolve({uid:32});
    }));
    changePassword_stub.returns(new Promise(function(resolve, reject) {
      resolve(true);
    }));
    request
        .post('/api/password/change')
        .send({access_token: access_token, oldPassword: '123456', password: '111111'})
        .set('syscode', 'FINANCE')//header info
        .set('source', 'APP')//header info
        .expect(200)
        .end(function (err, res) {
          var result = res.body;
          result.should.have.property('access_token');
          result.access_token.should.be.equal(access_token);
          done();
        });
  });

  it("重置密码[重置成功]", function (done) {
    validateSmsCaptcha_stub.returns(new Promise(function(resolve, reject) {
      resolve(true);
    }));
    resetPassword_stub.returns(new Promise(function(resolve, reject) {
      resolve(true);
    }));
    request
        .post('/api/password/reset')
        .send({mobile: mobile, password: '123456', smsCaptcha: '123456'})
        .set('syscode', 'FINANCE')//header info
        .set('source', 'APP')//header info
        .expect(200)
        .end(function (err, res) {
          var result = res.body;
          result.should.have.property('mobile');
          result.mobile.should.be.equal(mobile);
          done();
        });
  });

  afterEach(function() {
    getToken_stub.reset();
    checkPassword_stub.reset();
    resetPassword_stub.reset();
    changePassword_stub.reset();
    validateSmsCaptcha_stub.reset();
  });

});

after(function() {
  getToken_stub.restore();
  checkPassword_stub.restore();
  resetPassword_stub.restore();
  changePassword_stub.restore();
  validateSmsCaptcha_stub.restore();
});