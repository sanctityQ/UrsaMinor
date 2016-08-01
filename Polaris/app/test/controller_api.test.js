require('should');
var co = require('co');
var rewire = require('rewire');
var sinon = require('sinon');
var app = rewire('../server');
var request = require('supertest-koa-agent')(app);
var test = require('../libs/test');
var ex_utils = require('../libs/exception.js');
var apiCode = require('../conf/ApiCode');
var router = rewire('../router');
var _ = require('underscore');

var ctrs;

var passportModel;
var captchaModel;
var userModel;
var tokenModel;
var interactModel;

var clearSmsCaptcha_stub;
var validateSmsCaptcha_stub;
var register_stub;
var login_stub;
var putToken_stub;
var findUserByPassportUser_stub;
var triggerInteract_stub;
var findInviteInfoByUserKey_stub;

before(function () {
  //rewire 所有controller
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

  //设置router
  app.__set__({router: router});
  app.init(); //初始化server
  app.listen(80001); //启动服务

  passportModel = ctrs.api.__get__('passportModel');
  captchaModel = ctrs.api.__get__('captcha2Model');
  tokenModel = ctrs.api.__get__('tokenModel');
  userModel = ctrs.api.__get__('userModel');
  interactModel = ctrs.api.__get__('interactModel');
});
var tokenNo = "3213213123123213131";
var user = {
  "id": 65,
  "mobile": "14131313131",
  "loginName": "tc_1a8r7j3k5qkwu",
  "source": 2,
  "registerDate": 1452612882000,
  "lastLoginDate": 1453122445819
};

/**
 * 主流程API测试
 */
describe("主流程测试", function () {

  before(function() {
    clearSmsCaptcha_stub = sinon.stub(captchaModel, "clearSmsCaptcha");
    validateSmsCaptcha_stub = sinon.stub(captchaModel, "validateSmsCaptcha");
    register_stub = sinon.stub(passportModel, "register");
    login_stub = sinon.stub(passportModel, "login");
    putToken_stub = sinon.stub(tokenModel, "putToken");
    findUserByPassportUser_stub = sinon.stub(userModel, "findUserByPassportUser");
    triggerInteract_stub = sinon.stub(interactModel, "triggerInteract");
    findInviteInfoByUserKey_stub = sinon.stub(interactModel, "findInviteInfoByUserKey");
  });

  it("登录测试[登录成功]", function (done) {
    login_stub.returns(new Promise(function (resovel, reject) {
      resovel(user); //返回成功
    }));
    //tokenModel--putToken
    putToken_stub.returns(new Promise(function (resovel, reject) {
      resovel(tokenNo); //返回tokenNo
    }));
    //发送登录请求
    request
        .post('/api/login')
        .send({credential: '14131313131', password: '123456'}) //登录信息
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          //验证返回信息
          var result = res.body;
          result.should.have.property('access_token');
          result.access_token.should.be.equal(tokenNo);
          result.should.have.property('user');
          result.user.should.be.eql(user);

          sinon.assert.calledOnce(login_stub);
          sinon.assert.calledOnce(putToken_stub);
          done();
        });
  });

  it("登录测试[登录失败]", function (done) {
    login_stub.returns(new Promise(function (resovel, reject) {
      reject(ex_utils.buildCommonException(apiCode.E20008)); //账号或密码错误
    }));
    request
        .post('/api/login')
        .send({credential: '14131313131', password: '1234567'})
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(500)
        .end(function (err, res) {
          var result = res.body;
          result.should.have.property('error_code');
          result.error_code.should.be.equal(apiCode.E20008.err_code);
          sinon.assert.calledOnce(login_stub);
          done();
        });
  });

  it("注册测试[注册成功]", function (done) {
    validateSmsCaptcha_stub.returns(new Promise(function (resovel, reject) {
      resovel(true);
    }));
    register_stub.returns(new Promise(function (resovel, reject) {
      resovel(user);
    }));
    login_stub.returns(new Promise(function (resovel, reject) {
      resovel(user);
    }));
    putToken_stub.returns(new Promise(function (resovel, reject) {
      resovel(tokenNo); //返回tokenNo
    }));

    request
        .post('/api/register')
        .send({mobile: '14131313131', password: '123456', smsCaptcha: '123456'})
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = res.body;
          result.should.have.property('access_token');
          result.should.have.property('user');
          result.user.should.be.eql(user);

          sinon.assert.calledOnce(validateSmsCaptcha_stub);
          sinon.assert.calledOnce(register_stub);
          sinon.assert.calledOnce(clearSmsCaptcha_stub);
          sinon.assert.calledOnce(login_stub);
          sinon.assert.calledOnce(putToken_stub);
          done();
        });
  });

  it("注册测试[填写邀请码-注册成功]", function (done) {
    validateSmsCaptcha_stub.returns(new Promise(function (resovel, reject) {
      resovel(true);
    }));
    register_stub.returns(new Promise(function (resovel, reject) {
      resovel(user);
    }));
    login_stub.returns(new Promise(function (resovel, reject) {
      resovel(user);
    }));
    putToken_stub.returns(new Promise(function (resovel, reject) {
      resovel(tokenNo); //返回tokenNo
    }));
    findUserByPassportUser_stub.returns(new Promise(function (resovel, reject) {
      resovel({id:'13213-sdff-12312fasfa-fasf', name:"张三", passportId:user.id});
    }));
    findInviteInfoByUserKey_stub.returns(new Promise(function (resovel, reject) {
      resovel({user:{}, name:"张三", inviterInfo:{}});
    }));

    request
        .post('/api/register')
        .send({mobile: '14131313131', password: '123456', smsCaptcha: '123456', inviteCode:'T4321F'})
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = res.body;
          result.should.have.property('access_token');
          result.should.have.property('user');
          result.user.should.be.eql(user);

          sinon.assert.calledOnce(findInviteInfoByUserKey_stub);
          sinon.assert.calledOnce(validateSmsCaptcha_stub);
          sinon.assert.calledOnce(register_stub);
          sinon.assert.calledOnce(clearSmsCaptcha_stub);
          sinon.assert.calledOnce(login_stub);
          sinon.assert.calledOnce(putToken_stub);
          sinon.assert.calledOnce(findUserByPassportUser_stub);
          sinon.assert.calledOnce(triggerInteract_stub);
          done();
        });
  });

  it("注册失败[验证码错误]", function (done) {
    validateSmsCaptcha_stub.returns(new Promise(function (resovel, reject) {
      reject(ex_utils.buildCommonException(apiCode.E20006)); //验证码错误
    }));
    request
        .post('/api/register')
        .send({mobile: '14131313131', password: '123456', smsCaptcha: '1234567'})
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = res.body;
          result.should.have.property('error_code');
          result.error_code.should.be.equal(apiCode.E20006.err_code);
          sinon.assert.calledOnce(validateSmsCaptcha_stub);
          done();
        });
  });

  it("注册失败[手机号已被使用]", function (done) {
    validateSmsCaptcha_stub.returns(new Promise(function (resovel, reject) {
      resovel(true);
    }));
    register_stub.returns(new Promise(function (resovel, reject) {
      reject(ex_utils.buildCommonException(apiCode.E20001)); //手机号已被使用
    }));
    request
        .post('/api/register')
        .send({mobile: '12222222222', password: '123456', smsCaptcha: '123456'})
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = eval(res.body);
          result.should.have.property('error_code');
          result.error_code.should.be.equal(apiCode.E20001.err_code);
          sinon.assert.calledOnce(validateSmsCaptcha_stub);
          sinon.assert.calledOnce(register_stub);
          done();
        });
  });

  it("安全退出[成功]", function (done) {
    var removeToken_stub = sinon.stub(tokenModel, "removeToken", function (tokenNo) {
      return new Promise(function (resovel, reject) {
        resovel(true);
      });
    });
    request
        .get('/api/logout?access_token='+tokenNo)
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = res.body;
          result.should.have.property('access_token');
          result.access_token.should.be.equal(tokenNo);
          sinon.assert.calledOnce(removeToken_stub);
          done();
        });
  });

  afterEach(function() {
    validateSmsCaptcha_stub.reset();
    clearSmsCaptcha_stub.reset();
    register_stub.reset();
    login_stub.reset();
    putToken_stub.reset();
    findUserByPassportUser_stub.reset();
    triggerInteract_stub.reset();
    findInviteInfoByUserKey_stub.reset();
  });

  after(function() {
    validateSmsCaptcha_stub.restore();
    clearSmsCaptcha_stub.restore();
    register_stub.restore();
    login_stub.restore();
    putToken_stub.restore();
    findUserByPassportUser_stub.restore();
    triggerInteract_stub.restore();
    findInviteInfoByUserKey_stub.restore();
  });
});