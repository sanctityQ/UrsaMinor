var passportModel = require('../model/passport.js');
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
    var traceNo = this.req.traceNo + "";
    var validateInfo = {
      source: headerBody.source,
      sysCode: headerBody.syscode,
      traceNo: traceNo,
      name: 'MOBILE',
      value: query.mobile
    };
    tclog.notice({api: '/api/checkMobile', validateInfo: validateInfo});
    try {
      var result = yield passportModel.userValidate(validateInfo);
      tclog.notice({api:'/api/check/mobile', traceNo:traceNo, result:result});
      //不存在
      yield this.api({errorCode : "00000", errorMsg : "手机号不存在"});
    } catch(err) {
      tclog.warn({api:'/api/check/mobile', traceNo:traceNo, err:err});
      if(err.err_code == '20001') {
        yield this.api({errorCode : "20001", errorMsg : "手机号已使用"});
      } else {
        yield this.api({errorCode : err.err_code+"", errorMsg : err.err_msg});
      }
    }
  }

}