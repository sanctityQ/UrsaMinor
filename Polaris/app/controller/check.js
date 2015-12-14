var passportModel = require('../model/passport.js');
var apiCode = require("../conf/ApiCode.js");
var tclog = require('../libs/tclog.js');
var token = require('../model/token.js');
var _ = require('underscore');

module.exports = {

  /**
   * 校验手机号是否可用
   */
  checkMobile: function *() {
    var query = this.query;
    var headerBody = this.header;
    var validateInfo = {
      source: headerBody.source || 'APP',
      sysCode: headerBody.syscode,
      traceNo: this.req.logid + "",
      name: 'MOBILE',
      value: query.mobile
    };
    tclog.notice({api: '/api/checkMobile', validateInfo: validateInfo});
    var data = yield passportModel.userValidate(validateInfo);
    yield this.api(data);
  }

}