/**
 * @file api.js
 * @desc api控制器
 * @author bao
 * @date 2015/11/2
 */
var passportModel = require('../model/passport.js');
var captcha2Model = require('../model/captcha2.js');
var userModel = require('../model/user.js');
var interactModel = require('../model/interact.js');
var tclog = require('../libs/tclog.js');
var tokenModel = require('../model/token.js');
var _ = require('underscore');


module.exports = {

  /**
   * 登录
   */
  login: function *() {
    var postBody = this.request.body;
    var headerBody = this.header;
    var traceNo = this.req.traceNo+"";
    var loginInfo = { //登录信息
      source: headerBody.source,
      sysCode: headerBody.syscode,
      traceNo: traceNo,
      credential: postBody.credential,
      password: postBody.password
    };
    //日志输出不包含密码信息
    tclog.notice({api:'/api/login', loginInfo: _.omit(loginInfo, 'password')});
    try {
      var passportUser = yield passportModel.login(loginInfo);
      var tokenNo = yield tokenModel.putToken(loginInfo, passportUser);
      var result = {access_token:tokenNo, user:passportUser,msg:'登录成功'};
      yield this.api(result);
    } catch (err) { //500
      tclog.error({api:'/api/login', traceNo:traceNo, err:err});
      yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
    }
  },

  /**
   * 注册
   */
  register: function *() {
    var postBody = this.request.body;
    var headerBody = this.header;
    var smsCaptcha = postBody.smsCaptcha; //短信验证码(语音)
    var traceNo = this.req.traceNo+"";
    var registerInfo = {
      source: headerBody.source,
      sysCode: headerBody.syscode,
      traceNo: traceNo,
      mobile: postBody.mobile,
      password: postBody.password
    };
    tclog.notice({api:'/api/register', registerInfo: _.omit(registerInfo, 'password')});
    try {
      //TODO 是否要放在这里做? 校验邀请码
      var inviteCode = postBody.inviteCode;
      if(inviteCode) { //邀请码不区分大小写
        inviteCode = inviteCode.toUpperCase();
      }
      if(inviteCode) {
        try{
          //如果填写邀请码,验证邀请码是否正确
          var inviteInfo = yield interactModel.findInviteInfoByUserKey(inviteCode);
          tclog.debug({inviteInfo : inviteInfo});
        } catch(err) {
          if(err.err_code == 10001) { 
            //interact服务异常,不能影响注册
            tclog.error({msg : "findInviteInfoByUserKey err"})
          } else {
            throw err;
          }
        }
      }
      
      //短信验证码是否正确
      var biz_type = captcha2Model.BIZ_TYPE.REGISTER;
      var validObj = {biz_type:biz_type, captcha:smsCaptcha, mobile:registerInfo.mobile};
      yield captcha2Model.validateSmsCaptcha(registerInfo.traceNo, validObj);
      //调用注册接口
      yield passportModel.register(registerInfo);
      captcha2Model.clearSmsCaptcha(traceNo, registerInfo.mobile, biz_type);//清除注册短信
      var loginInfo = { //登录信息
        source: headerBody.source,
        sysCode: headerBody.syscode,
        traceNo: traceNo,
        credential: postBody.mobile,
        password: postBody.password
      };
      //注册成功自动登录
      var passportUser = yield passportModel.login(loginInfo);
      var tokenNo = yield tokenModel.putToken(loginInfo, passportUser);
      var result = {access_token:tokenNo, user:passportUser,msg:'登录成功'};
      if(inviteCode) { //如果填写了邀请码
        userModel.findUserByPassportUser(passportUser).then(function(user) {
          tclog.notice({msg:"triggerInteract register", user:user.id, inviteCode:inviteCode});
          interactModel.triggerInteract(0, user.id, inviteCode, user.id);
        }).catch(function(err) {
          tclog.error({msg:"triggerInteract error", user:user.id, inviteCode:inviteCode, err:err});
        });
      }
      yield this.api(result);
    } catch (err) {
      tclog.warn({api:'/api/register', traceNo:traceNo, err:err});
      yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
    }
  },

  /**
   * 安全退出
   */
  logout: function* () {
    var query = this.query;
    var headerBody = this.header;
    var traceNo = this.req.traceNo+"";
    var tokenNo = query.access_token;
    tclog.notice({api:'api/logout', traceNo:traceNo, source:headerBody.source, sysCode:headerBody.syscode, tokenNo: tokenNo});
    var tokenInfo = {
      source:headerBody.source,
      sysCode:headerBody.syscode,
      traceNo: traceNo,
      tokenNo: tokenNo
    }
    var result = yield tokenModel.removeToken(tokenInfo);
    tclog.notice({api:'/api/logout', traceNo:traceNo, result:result});
    yield this.api({access_token:tokenNo, msg:'退出成功'});
  }
};
