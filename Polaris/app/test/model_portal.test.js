require("should");
var nock = require('nock');
var rewire = require('rewire');
var sinon = require('sinon');
var portalModel = rewire("../model/portal");
var config = require("../../conf/index.js");

before(function() {
  var tclog = portalModel.__get__('tclog');
  tclog.init();
});

describe("同盾测试[开发模式]", function () {
  before(function(){
    portalModel.__set__('developMode', true);
  });
  it("同盾测试手机号验证", function (done) {
    var checkInfo = {traceNo:'xxxxxx', token_id: 'xxxxxx',  mobile: '13333333333', ip: '127.0.0.1'};
    portalModel.mobileCheck(checkInfo).then(function(response) {
      response.should.have.property('status');
      response.status.should.be.equal(true);
      response.score.should.be.equal(0);
      done();
    }, function(err) {
    });
  });
});


describe("同盾测试[非开发模式]", function () {
  before(function(){
    portalModel.__set__('developMode', false);
  });
  it("同盾服务正常返回", function (done) {
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
    portalModel.mobileCheck(checkInfo).then(function(response) {
      response.should.have.property('status');
      response.status.should.be.equal(true);
      response.score.should.be.equal(20);
      done();
    }, function(err) {
    });
  });

  it("同盾服务异常", function (done) {
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
    portalModel.mobileCheck(checkInfo).then(function(response) {
      response.should.have.property('status');
      response.status.should.be.equal(false);
      done();
    }, function(err) {
      console.log(err);
      done();
    });
  });
});