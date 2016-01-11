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
      source: headerBody.source || 'APP',
      sysCode: headerBody.syscode,
      traceNo: traceNo,
      name: 'MOBILE',
      value: query.mobile
    };
    tclog.notice({api: '/api/checkMobile', validateInfo: validateInfo});
    try {
      var result = yield passportModel.userValidate(validateInfo);
      tclog.notice({api:'/api/check/mobile', traceNo:traceNo, result:result});
      yield this.api({mobile:query.mobile, msg:'验证通过'});
    } catch(err) {
      tclog.warn({api:'/api/check/mobile', traceNo:traceNo, err:err});
      yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
    }
  }

}