require("should");
var portalModel = require("../model/portal");
var config = require("../../conf/index.js");

describe("同盾测试", function () {
  it("同盾测试手机号验证", function (done) {
    portalModel.mobileCheck().then(function(response) {
      console.log(response);
      done();
    }, function(err) {
      console.log(err);
      done();
    });
  });
});
