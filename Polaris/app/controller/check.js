var passportModel = require('../model/passport.js');
var userModel = require('../model/user.js');
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
      yield this.api({mobile:query.mobile, msg:'验证通过'});
    } catch(err) {
      tclog.warn({api:'/api/check/mobile', traceNo:traceNo, err:err});
      yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
    }
  },

  /**
   * 验证手机号和身份证是否匹配
   */
  matchIdNumber: function *() {
    var postBody = this.request.body;
    var mobile = postBody.mobile;
    var name = postBody.name;
    var idNumber = postBody.idNumber;
    var user = yield userModel.findUserByMobile(mobile);
    if(userModel.checkIdNumber(user, name, idNumber)) {
      yield this.api({mobile:mobile, msg:'验证通过'});
    } else {
      yield this.api_err({error_code : 20017, error_msg : "身份信息不匹配"});
    }
  }

}