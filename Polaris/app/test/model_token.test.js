require("should");
var apiCode = require('../conf/apiCode');
var conf = require("../../conf");
var rewire = require('rewire');
var tokenModel = rewire("../model/token.js");
var test = require("../libs/test");

before(function () {
  tokenModel.__set__({
                       tclog: test.tclog
                     });

});

describe("token[putToken]", function () {

  it("putToken[success]", function (done) {
    var loginInfo = {
      source: 0,
      sysCode: 0,
      traceNo: "xxxxxx"
    };
    var passportUser = {id: 52};
    tokenModel.putToken(loginInfo, passportUser).then(function (data) {
      console.log(data);
      data.should.not.empty();
      done();
    });
  });
});

describe("token[removeToken]", function () {

  it("removeToken[success]", function (done) {
    tokenModel.removeToken("23b635430ebae54ea27b1cc6682f8404026467e87e84a9fb1844f4b1fad384f0").then(
        function (data) {
          data.should.have.property('header');
          data.header.should.eql(apiCode.SUCCESS);
          done();
        });
  });
});