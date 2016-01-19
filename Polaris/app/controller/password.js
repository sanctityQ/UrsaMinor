var passportModel = require('../model/passport.js');
var captcha2Model = require('../model/captcha2.js');
var tokenModel = require('../model/token.js');
var tclog = require('../libs/tclog.js');

module.exports = {

  /**
   * 验证原始密码
   */
  check: function* (){
    var postBody = this.request.body;
    var headerBody = this.header;
    var traceNo = this.req.traceNo+"";
    var tokenNo = postBody.access_token;
    try {
      //获取token信息
      var token = yield tokenModel.getToken(traceNo, tokenNo);
      var checkInfo = {source: headerBody.source, sysCode: headerBody.syscode, traceNo: traceNo,
        userId: token.uid, oldPassword: postBody.oldPassword};
      //验证密码是否正确
      var result = yield passportModel.checkPassword(checkInfo);
      tclog.notice({api:'/api/password/check', traceNo:traceNo, result:result});
      yield this.api({access_token:tokenNo, msg:'密码验证通过'});
    } catch (err) {
      tclog.error({api:'/api/password/check', traceNo:traceNo, err:err});
      yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
    }
  },

  /**
   * 重置密码
   */
  reset: function* () {
    var postBody = this.request.body;
    var headerBody = this.header;
    var traceNo = this.req.traceNo+"";
    var mobile = postBody.mobile;
    var password = postBody.password; //新密码(用户设置)
    var smsCaptcha = postBody.smsCaptcha; //短信验证码(语音)
    try {
      var biz_type = captcha2Model.BIZ_TYPE.RESETPWD;
      var validObj = {biz_type: biz_type, mobile: mobile, captcha: smsCaptcha};
      var flag = yield captcha2Model.validateSmsCaptcha(traceNo, validObj);
      tclog.notice({api: '/api/password/reset', traceNo: traceNo, validate_flag: flag});
      var resetInfo = {source: headerBody.source, sysCode: headerBody.syscode, traceNo: traceNo,
        mobile: mobile, password: password};
      var result = yield passportModel.resetPassword(resetInfo);
      tclog.notice({api: '/api/password/reset', traceNo: traceNo, result: result});
      captcha2Model.clearSmsCaptcha(traceNo, mobile, biz_type); //清除找回密码验证码
      yield this.api({mobile:mobile, msg:'密码已重置'});
    } catch (err) {
      tclog.error({api:'/api/password/reset', traceNo:traceNo, err:err});
      yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
    }
  },


  /**
   * 修改密码
   */
  change: function* () {
    //TODO 图片验证码
    var postBody = this.request.body;
    var headerBody = this.header;
    var traceNo = this.req.traceNo+"";
    var tokenNo = postBody.access_token;
    tclog.notice({api:'api/change', traceNo:traceNo, source:headerBody.source, sysCode:headerBody.syscode, tokenNo: tokenNo});
    try {
      var token = yield tokenModel.getToken(traceNo, tokenNo);
      var changeInfo = {source: headerBody.source, sysCode: headerBody.syscode, traceNo: traceNo,
        userId: token.uid, oldPassword: postBody.oldPassword, password: postBody.password};
      var result = yield passportModel.changePassword(changeInfo);
      tclog.notice({api:'/api/password/change', traceNo:traceNo, result:result});
      yield this.api({access_token:tokenNo, msg:'修改成功'});
    } catch (err) {
      tclog.error({api:'/api/password/change', traceNo:traceNo, err:err});
      yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
    }
  }
};