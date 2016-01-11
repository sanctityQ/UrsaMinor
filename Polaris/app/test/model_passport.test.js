require("should");
var thrift = require('thrift');
var rewire = require('rewire');
var sinon = require('sinon');
var apiCode = require('../conf/apiCode');
var test = require('../libs/test');
var passportModel = rewire("../model/passport");
var _ = require('underscore');

var user = {
  "id": new thrift.Int64(52),
  "mobile": "15131235327",
  "loginName": "tc_1a612duqo1e1c",
  "source": 0,
  "syscode": 0,
  "registerDate": new thrift.Int64(1449587571000),
  "lastLoginDate": new thrift.Int64(1449664805678)
};

var client;

before(function () {
  //覆盖tclog
  passportModel.__set__({
                          tclog: test.tclog
                        });
});

beforeEach(function () {
  //重新指定client
  client = _.clone(test.PASSPORT_THRIFT_CLIENT);
  passportModel.__set__({
                          client: client
                        });
});

describe("passportModel--登录接口", function () {
  var loginInfo = { //登录信息
    source: 'APP',
    sysCode: 'FINANCE',
    traceNo: 'xxxxxxxx',
    credential: '15131235327',
    password: '123456'
  };

  var loginRequest = {
    header: {
      source: 2,
      sysCode: 1,
      traceNo: "xxxxxxxx"
    },
    credential: '15131235327',
    password: '123456'
  };

  it("登录接口[正常返回]", function (done) {
    var stub = sinon.stub(client, "login", function (request, cb) {
      cb(null, user);
    });
    passportModel.login(loginInfo).then(function (data) {
      data.should.have.property('id'); //用户ID
      data.id.should.equal(user.id.valueOf());
      data.mobile.should.equal(loginInfo.credential);//手机号

      sinon.assert.calledOnce(stub); //登陆接口调用一次
      sinon.assert.calledWith(stub, sinon.match(loginRequest), sinon.match.func);
      done();
    });
  });

  it("登录接口[参数错误]", function (done) {
    var stub = sinon.stub(client, "login", function (request, cb) {
      cb(null, user);
    });
    var errInfo = _.clone(loginInfo);
    errInfo.source = "ERR SOURCE";
    passportModel.login(errInfo).then(function (data) {
    }, function(err) { //参数异常
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E20098.err_code);

      sinon.assert.notCalled(stub); //未调用后台接口
      done();
    }) ;
  });

  it("登录接口[服务异常]", function (done) {
    var stub = sinon.stub(client, "login", function (request, cb) {
      cb(new Error("CONNECTION TIMEOUT"), null); //mock网络异常
    });
    passportModel.login(loginInfo).then(function (data) {
    }, function(err) {
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E10001.err_code);
      sinon.assert.calledOnce(stub);
      sinon.assert.calledWith(stub, sinon.match(loginRequest), sinon.match.func);
      done();
    });
  });
});

describe("passportModel--注册接口", function () {
  var registerInfo = { //注册信息
    source: 'APP',
    sysCode: 'FINANCE',
    traceNo: 'xxxxxxxx',
    mobile: '15131235327',
    password: '123456'
  };

  var registerRequest = {
    header: {
      source: 2,
      sysCode: 1,
      traceNo: "xxxxxxxx"
    },
    mobile: "15131235327",
    password: "123456"
  };

  it("注册接口[正常返回]", function (done) {
    var stub = sinon.stub(client, "reg", function (request, cb) {
      cb(null, user);
    });
    passportModel.register(registerInfo).then(function (data) {
      data.should.have.property('id'); //用户ID
      data.id.should.equal(user.id.valueOf());
      data.mobile.should.equal(registerInfo.mobile);//手机号

      sinon.assert.calledOnce(stub);
      sinon.assert.calledWith(stub,
                              sinon.match(registerRequest),
                              sinon.match.func);
      done();
    });
  });

  it("注册接口[参数错误]", function (done) {
    var errInfo = _.clone(registerInfo);
    errInfo.sysCode = 'ERR SYSCODE';
    var stub = sinon.stub(client, "reg", function (request, cb) {
      cb(null, user);
    });
    passportModel.register(errInfo).then(function (data) {
    }, function(err) {
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E20098.err_code);

      sinon.assert.notCalled(stub); //未调用后台接口
      done();
    });
  });

  it("注册接口[服务异常]", function (done) {
    var stub = sinon.stub(client, "reg", function (request, cb) {
      cb(new Error("CONNECTION TIMEOUT"), null);
    });
    passportModel.register(registerInfo).then(function (data) {
    }, function(err) {
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E10001.err_code);

      sinon.assert.calledOnce(stub);
      sinon.assert.calledWith(stub, sinon.match(registerRequest), sinon.match.func);
      done();
    });
  });

});

describe("passportModel--用户信息验证接口", function () {
  var validateInfo = { //验证信息
    source: 'APP',
    sysCode: 'FINANCE',
    traceNo: 'xxxxxxxx',
    name: 'MOBILE',
    value: '15131235327'
  };

  it("用户信息验证接口[正常返回]", function (done) {
    var stub = sinon.stub(client, "userValidate", function (request, cb) {
      cb(null, 'true');
    });
    passportModel.userValidate(validateInfo).then(function (data) {
      data.should.equal('true');
      sinon.assert.calledOnce(stub);
      done();
    });
  });

  it("用户信息验证接口[参数错误]", function (done) {
    var errInfo = _.clone(validateInfo);
    errInfo.value = null;
    var stub = sinon.stub(client, "userValidate", function (request, cb) {
      cb(null, 'true');
    });
    passportModel.userValidate(errInfo).then(function (data) {
    }, function(err) {
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E20098.err_code);

      sinon.assert.notCalled(stub); //未调用后台接口
      done();
    });
  });

  it("用户信息验证接口[服务异常]", function (done) {
    var stub = sinon.stub(client, "userValidate", function (request, cb) {
      cb(new Error("CONNECTION TIMEOUT"), null);
    });
    passportModel.userValidate(validateInfo).then(function (data) {
    }, function(err) {
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E10001.err_code);

      sinon.assert.calledOnce(stub);
      done();
    });
  });
});

describe("passportModel--重置密码接口", function () {
  var resetInfo = { //验证信息
    source: 'APP',
    sysCode: 'FINANCE',
    traceNo: 'xxxxxxxx',
    mobile: '15131235327'
  };

  it("重置密码接口[正常返回]", function (done) {
    var stub = sinon.stub(client, "resetPassword", function (request, cb) {
      cb(null, 'true');
    });
    passportModel.resetPassword(resetInfo).then(function (data) {
      data.should.equal('true');
      sinon.assert.calledOnce(stub);
      done();
    });
  });

  it("重置密码接口[参数错误]", function (done) {
    var errInfo = _.clone(resetInfo);
    errInfo.mobile = null;
    var stub = sinon.stub(client, "resetPassword", function (request, cb) {
      cb(null, 'true');
    });
    passportModel.resetPassword(errInfo).then(function (data) {
    }, function(err) {
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E20098.err_code);

      sinon.assert.notCalled(stub); //未调用后台接口
      done();
    });
  });

  it("重置密码接口[服务异常]", function (done) {
    var stub = sinon.stub(client, "resetPassword", function (request, cb) {
      cb(new Error("CONNECTION TIMEOUT"), null);
    });
    passportModel.resetPassword(resetInfo).then(function (data) {
    }, function(err) {
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E10001.err_code);

      sinon.assert.calledOnce(stub);
      done();
    });
  });
});

describe("passportModel--修改密码接口", function () {
  var changeInfo = { //验证信息
    source: 'APP',
    sysCode: 'FINANCE',
    traceNo: 'xxxxxxxx',
    userId: 52,
    oldPassword: '123456',
    password: 'qwe123'
  };

  it("修改密码接口[正常返回]", function (done) {
    var stub = sinon.stub(client, "changePassword", function (request, cb) {
      cb(null, 'true');
    });
    passportModel.changePassword(changeInfo).then(function (data) {
      data.should.equal('true');
      sinon.assert.calledOnce(stub);
      done();
    });
  });

  it("修改密码接口[参数错误]", function (done) {
    var errInfo = _.clone(changeInfo);
    errInfo.oldPassword = null;
    var stub = sinon.stub(client, "changePassword", function (request, cb) {
      cb(null, 'true');
    });
    passportModel.changePassword(errInfo).then(function (data) {
    }, function(err) {
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E20098.err_code);

      sinon.assert.notCalled(stub); //未调用后台接口
      done();
    });
  });

  it("修改密码接口[服务异常]", function (done) {
    var stub = sinon.stub(client, "changePassword", function (request, cb) {
      cb(new Error("CONNECTION TIMEOUT"), null);
    });
    passportModel.changePassword(changeInfo).then(function (data) {
    }, function(err) {
      err.should.have.property('err_code');
      err.err_code.should.equal(apiCode.E10001.err_code);

      sinon.assert.calledOnce(stub);
      done();
    });
  });
});