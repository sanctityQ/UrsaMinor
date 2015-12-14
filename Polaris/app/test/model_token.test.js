require("should");
var apiCode = require('../conf/apiCode');
var conf = require("../../conf");
var rewire = require('rewire');
var tokenModel = rewire("../model/token.js");

before(function () {
  tokenModel.__set__({
                         tclog: {
                           notice: function (data) {
                             console.log(data);
                           },
                           error: function (data) {
                             console.error(data);
                           },
                           warn: function (data) {
                             console.warn(data);
                           }
                         }
                       });

});

describe("token[putToken]", function () {

  it("putToken[success]", function (done) {
    var loginResult = {
      source: 0,
      sysCode: 0,
      user: {id:52}
    };
    tokenModel.putToken("xxxxxxx", loginResult).then(function(data) {
      console.log(data);
      done();
    });
  });
});

describe("token[removeToken]", function () {

  it("removeToken[success]", function (done) {
    tokenModel.removeToken("23b635430ebae54ea27b1cc6682f8404026467e87e84a9fb1844f4b1fad384f0").then(function(data) {
      console.log(data);
      done();
    });
  });
});