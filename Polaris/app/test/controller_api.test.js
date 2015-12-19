require('should');
var co = require('co');
var rewire = require('rewire');
var sinon = require('sinon');
var app = rewire('../server');
var request = require('supertest-koa-agent')(app);
var test = require('../libs/test');
var apiCode = require('../conf/apiCode');
var router = rewire('../router');
var _ = require('underscore');

var ctrs;

var passportModel;
var tokenModel;
var captchaModel;

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
  app.listen(8800); //启动服务
});

beforeEach(function() {
  passportModel = _.clone(test.PASSPORT_MODEL);
  tokenModel = _.clone(test.TOKEN_MODEL);
  captchaModel = _.clone(test.CAPTCHA_MODEL);
  ctrs.api.__set__({
                     passportModel: passportModel,
                     captchaModel: captchaModel,
                     tokenModel: tokenModel
                   });
});

/**
 * 登录api测试
 */
describe("api login test", function () {
  it("login success", function (done) {
    //passportModel--login
    var loginStub = sinon.stub(passportModel, "login", function (validateInfo) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS}); //返回成功
      });
    });
    //tokenModel--putToken
    var putTokenStub = sinon.stub(tokenModel, "putToken", function (traceNo, loginResult) {
      return new Promise(function (resovel, reject) {
        resovel("3213213123123213131"); //返回tokenNo
      });
    });
    //发送登录请求
    request
        .post('/api/login')
        .send({credential: '13333333333', password: '123456'}) //登录信息
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          //验证返回信息
          var result = eval(res.body);
          result.should.have.property('header');
          result.should.have.property('access_token');
          result.header.should.have.eql(apiCode.SUCCESS);
          result.access_token.should.have.eql("3213213123123213131");

          sinon.assert.calledOnce(loginStub);
          sinon.assert.calledOnce(putTokenStub);
          done();
        });
  });

  it("login password error", function (done) {
    var loginStub = sinon.stub(passportModel, "login", function (validateInfo) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.E20008});
      });
    });
    request
        .post('/api/login')
        .send({credential: '13333333333', password: '1234567'})
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = eval(res.body);
          result.should.have.property('header');
          result.header.should.have.eql(apiCode.E20008);

          sinon.assert.calledOnce(loginStub);
          done();
        });

  })


});

describe("api register test", function() {

  it("register success", function (done) {
    var validate4RegisterStub = sinon.stub(captchaModel, "validate4Register", function (traceNo, mobile, smsCaptcha) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS});
      });
    });
    var registerStub = sinon.stub(passportModel, "register", function (registerInfo) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS});
      });
    });
    var loginStub = sinon.stub(passportModel, "login", function (loginInfo) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS});
      });
    });
    var putTokenStub = sinon.stub(tokenModel, "putToken", function (traceNo, loginResult) {
      return new Promise(function (resovel, reject) {
        resovel("3213213123123213131");
      });
    });

    request
        .post('/api/register')
        .send({mobile: '13333333333', password: '123456', smsCaptcha: '123456'})
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = eval(res.body);
          result.should.have.property('header');
          result.should.have.property('access_token');
          result.header.should.have.eql(apiCode.SUCCESS);

          sinon.assert.calledOnce(validate4RegisterStub);
          sinon.assert.calledOnce(registerStub);
          sinon.assert.calledOnce(loginStub);
          sinon.assert.calledOnce(putTokenStub);
          done();
        });
  });

  it("register smsCaptcha error", function (done) {
    var validate4RegisterStub = sinon.stub(captchaModel, "validate4Register", function (traceNo, mobile, smsCaptcha) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.E20006});
      });
    });
    request
        .post('/api/register')
        .send({mobile: '12222222222', password: '123456', smsCaptcha: '123456'})
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = eval(res.body);
          result.should.have.property('header');
          result.header.should.have.eql(apiCode.E20006);
          sinon.assert.calledOnce(validate4RegisterStub);
          done();
        });
  });

  it("register mobile used", function (done) {
    var validate4RegisterStub = sinon.stub(captchaModel, "validate4Register", function (traceNo, mobile, smsCaptcha) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS});
      });
    });
    var registerStub = sinon.stub(passportModel, "register", function (registerInfo) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.E20001});
      });
    });
    request
        .post('/api/register')
        .send({mobile: '12222222222', password: '123456', smsCaptcha: '123456'})
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = eval(res.body);
          result.should.have.property('header');
          result.header.should.have.eql(apiCode.E20001);
          sinon.assert.calledOnce(validate4RegisterStub);
          sinon.assert.calledOnce(registerStub);
          done();
        });
  });
});

describe("api logout test", function () {
  it("logout success", function (done) {
    var removeTokenStub = sinon.stub(tokenModel, "removeToken", function (tokenNo) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS});
      });
    });
    request
        .get('/api/logout?access_token=312312321312312')
        .set('source', 'APP')//header info
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = eval(res.body);
          result.should.have.property('header');
          result.header.should.have.eql(apiCode.SUCCESS);
          sinon.assert.calledOnce(removeTokenStub);
          done();
        });
  });
});
