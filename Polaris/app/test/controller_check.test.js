require('should');
var rewire = require('rewire');
var sinon = require('sinon');
var app = rewire('../server');
var request = require('supertest-koa-agent')(app);
var test = require('../libs/test');
var apiCode = require('../conf/apiCode');
var router = rewire('../router');
var _ = require('underscore');

var ctrs;
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
  //router(app);
  app.listen(8001);
});

describe("check test", function () {
  var passportModel;
  beforeEach(function () {
    passportModel = _.clone(test.PASSPORT_MODEL);
    ctrs.check.__set__({
                         passportModel: passportModel
                       });
  });
  it("check mobile 500", function (done) {
    var stub = sinon.stub(passportModel, "userValidate", function (validateInfo) {
      return new Promise(function (resovel, reject) {
        resovel({header: apiCode.SUCCESS});
      });
    });
    request
        .get('/api/check/mobile?mobile=15138695162')
        .set('syscode', 'FINANCE')//header info
        .expect(200)
        .end(function (err, res) {
          var result = eval(res.body);
          console.log(result);
          done();
        });
  });
});
