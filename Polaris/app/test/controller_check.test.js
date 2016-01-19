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
var userValidate_stub;
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
  app.listen(80003);
  passportModel = ctrs.check.__get__('passportModel');
});

var mobile = '15138695162';
describe("数据验证接口", function () {
  before(function() {
    userValidate_stub = sinon.stub(passportModel, "userValidate");
  });
  it("手机号验证[验证通过]", function (done) {
    userValidate_stub.returns(new Promise(function (resovel, reject) {
      resovel(true);
    }));
    request
        .get('/api/check/mobile?mobile='+mobile)
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


  it("手机号验证[手机号已存在]", function (done) {
    userValidate_stub.returns(new Promise(function (resovel, reject) {
      reject(ex_utils.buildCommonException(apiCode.E20001)); //手机号已被使用
    }));
    request
        .get('/api/check/mobile?mobile='+mobile)
        .set('syscode', 'FINANCE')//header info
        .set('source', 'APP')//header info
        .expect(500)
        .end(function (err, res) {
          var result = res.body;
          result.should.have.property('error_code');
          result.error_code.should.be.equal(apiCode.E20001.err_code);
          done();
        });
  });

  afterEach(function() {
    userValidate_stub.reset();
  });

  after(function() {
    userValidate_stub.restore();
  });

});