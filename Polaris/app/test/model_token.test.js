require("should");
var sinon = require('sinon');
var apiCode = require('../conf/ApiCode');
var conf = require("../../conf");
var rewire = require('rewire');
var tokenModel = rewire("../model/token.js");
var test = require("../libs/test");

var redis_client;
before(function () {
  redis_client = tokenModel.__get__('redis_client');
  var tclog = tokenModel.__get__('tclog');
  tclog.init();
});

describe("token[putToken]", function () {
  it("putToken[success]", function (done) {
    var loginInfo = {
      source: 'APP',
      sysCode: 'P2P',
      traceNo: "xxxxxxxxx"
    };
    var passportUser = {id: 52};
    var setex_stub = sinon.stub(redis_client, 'setex', function(k, ttl, obj, cb) {
      cb(null, 1);
    });
    tokenModel.putToken(loginInfo, passportUser).then(function (data) {
      data.should.be.not.empty();
      sinon.assert.calledOnce(setex_stub);
      setex_stub.restore();
      done();
    }, function(err){
    });
  });
});

describe("token[getToken]", function () {
  it("getToken[success]", function (done) {
    var traceNo = 'xxxxxxxxxxxxx';
    var tokenNo = '21695daa5288024f5a751689abbd57a1e3639d612310c2478fa7875ec02d1752';
    var tokenInfo = {
      "source": 2,
      "sysCode": 0,
      "uid": 312,
      "createTime": 1453036316034,
      "expireTime": 1453641116034
    };
    var get_stub = sinon.stub(redis_client, 'get', function(k, cb) {
      cb(null, JSON.stringify(tokenInfo));
    });
    var expire_stub = sinon.stub(redis_client, 'expire');
    tokenModel.getToken(traceNo, tokenNo).then(function (data) {
      data.should.be.eql(tokenInfo);
      sinon.assert.calledOnce(get_stub);
      sinon.assert.calledOnce(expire_stub);
      get_stub.restore();
      expire_stub.restore();
      done();
    }, function(err){
    });
  });


  it("getToken[tokenNo invalid]", function (done) {
    var traceNo = 'xxxxxxxxxxxxx';
    var tokenNo = '21695daa5288024f5a751689abbd57a1e3639d612310c2478fa7875ec02d1752';
    var tokenInfo = {
      "source": 2,
      "sysCode": 0,
      "uid": 312,
      "createTime": 1453036316034,
      "expireTime": 1453641116034
    };
    var get_stub = sinon.stub(redis_client, 'get', function(k, cb) {
      cb(null, null);
    });
    tokenModel.getToken(traceNo, tokenNo).then(function (data) {
    }, function(err){
      err.should.have.property("err_code");
      err.err_code.should.be.equal(apiCode.E20099.err_code);
      sinon.assert.calledOnce(get_stub);
      get_stub.restore();
      done();
    });
  });
});

describe("token[removeToken]", function () {

  it("removeToken[success]", function (done) {
    var tokenInfo = {
      traceNo : '13213213123123',
      tokenNo : "23b635430ebae54ea27b1cc6682f8404026467e87e84a9fb1844f4b1fad384f0"
    };
    var del_stub = sinon.stub(redis_client, 'del', function(key, cb) {
      cb(null, 1);
    });
    tokenModel.removeToken(tokenInfo).then(function (data) {
      data.should.equal(true);
      sinon.assert.calledOnce(del_stub);
      del_stub.restore();
      done();
    });
  });

  it("removeToken[success](redis-error)", function (done) {
    var tokenInfo = {
      traceNo : '13213213123123',
      tokenNo : "23b635430ebae54ea27b1cc6682f8404026467e87e84a9fb1844f4b1fad384f0"
    };
    var del_stub = sinon.stub(redis_client, 'del', function(key, cb) {
      cb(new Error("connection error"), null);
    });
    tokenModel.removeToken(tokenInfo).then(function (data) {
      data.should.equal(true);
      sinon.assert.calledOnce(del_stub);
      del_stub.restore();
      done();
    });
  });
});