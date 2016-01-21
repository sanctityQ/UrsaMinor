require("should");
var nock = require('nock');
var rewire = require('rewire');
var sinon = require('sinon');
var portalModel = rewire("../model/portal");
var config = require("../../conf/index.js");

var redis_client;

var set_tub;
var pexpireat_tub;

before(function() {
  redis_client = portalModel.__get__('redis_client');
  var tclog = portalModel.__get__('tclog');
  tclog.init();
});

describe("同盾测试[开发模式]", function () {
  before(function(){
    portalModel.__set__('developMode', true);

    set_tub = sinon.stub(redis_client, 'set');
    pexpireat_tub = sinon.stub(redis_client, 'pexpireat');
  });
  it("同盾测试手机号验证", function (done) {
    var mobileCheck = {score:0, count:5};
    var checkInfo = {traceNo:'xxxxxx', token_id: 'xxxxxx',  mobile: '13333333333', ip: '127.0.0.1'};
    portalModel.mobileCheck(checkInfo, mobileCheck);
    sinon.assert.calledOnce(set_tub);
    sinon.assert.calledOnce(pexpireat_tub);
    done();
  });

  afterEach(function(){
    set_tub.reset();
    pexpireat_tub.reset();
  });

  after(function() {
    set_tub.restore();
    pexpireat_tub.restore();
  });
});


describe("同盾测试[非开发模式]", function () {
  before(function(){
    portalModel.__set__('developMode', false);

    set_tub = sinon.stub(redis_client, 'set');
    pexpireat_tub = sinon.stub(redis_client, 'pexpireat');
  });
  it("同盾服务正常返回", function () {
    var mobileCheck = {score:0, count:5};
    var checkInfo = {traceNo:'xxxxxx', token_id: 'xxxxxx',  mobile: '13333333333', ip: '127.0.0.1'};
    nock("https://apitest.fraudmetrix.cn")
        .post("/riskService", {
          token_id: checkInfo.token_id,
          partner_code: config.portal.partner_code,
          secret_key: config.portal.secret_key,
          event_id: config.portal.events.phoneCheck,
          account_mobile: checkInfo.mobile,
          ip_address: checkInfo.ip,
          resp_detail_type:config.portal.resp_detail_type
        })
        .reply(200, {
          success: true,
          final_score: 20
        });
    portalModel.mobileCheck(checkInfo, mobileCheck);
    setTimeout(function() {
      sinon.assert.calledOnce(set_tub);
      sinon.assert.calledOnce(pexpireat_tub);
    }, 1000);
  });

  it("同盾服务异常", function () {
    var mobileCheck = {score:0, count:5};
    var checkInfo = {traceNo:'xxxxxx', token_id: 'xxxxxx',  mobile: '13333333333', ip: '127.0.0.1'};
    nock("https://apitest.fraudmetrix.cn")
        .post("/riskService", {
          token_id: checkInfo.token_id,
          partner_code: config.portal.partner_code,
          secret_key: config.portal.secret_key,
          event_id: config.portal.events.phoneCheck,
          account_mobile: checkInfo.mobile,
          ip_address: checkInfo.ip,
          resp_detail_type:config.portal.resp_detail_type
        })
        .reply(function (uri, requestBody) {
          return [500, 'THIS IS THE REPLY BODY'];
        });
    portalModel.mobileCheck(checkInfo, mobileCheck);
    setTimeout(function() {
      sinon.assert.calledOnce(set_tub);
      sinon.assert.calledOnce(pexpireat_tub);
    }, 1000);
  });

  afterEach(function(){
    set_tub.reset();
    pexpireat_tub.reset();
  });

  after(function() {
    set_tub.restore();
    pexpireat_tub.restore();
  });
});