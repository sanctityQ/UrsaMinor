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
var wechat = require('../model/social/wechat');
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
      source: headerBody.source, sysCode: headerBody.syscode, traceNo: traceNo,
      credential: postBody.credential, password: postBody.password
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
    var sysCode = headerBody.syscode;
    var clientInfo_ = headerBody["x-client"];
    if(clientInfo_) {
      //"build":"1","os":"iOS","device" :"iPhone","app":"tc","ver" : "1.3.0","osv" : "9.2.1","scr"
      // : "{640, 1136}","net" : "WIFI"
      var clientInfo = JSON.parse(clientInfo_);
      if(clientInfo && clientInfo.app) {
        if(clientInfo.app == 'tc') {
          sysCode = "P2P";
        } else if(clientInfo.app == 'nj') {
          sysCode = "FINANCE";
        }
      }
    }
    var smsCaptcha = postBody.smsCaptcha; //短信验证码(语音)
    var traceNo = this.req.traceNo+"";
    var registerInfo = {
      source: headerBody.source, sysCode: sysCode, traceNo: traceNo,
      mobile: postBody.mobile, password: postBody.password
    };
    tclog.notice({api:'/api/register', registerInfo: _.omit(registerInfo, 'password')});
    try {
      //TODO 是否要放在这里做? 校验邀请码
      var inviteCode = postBody.inviteCode;
      if(inviteCode) {
        //邀请码不区分大小写
        inviteCode = inviteCode.toUpperCase();
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
        source: headerBody.source, sysCode: sysCode, traceNo: traceNo,
        credential: postBody.mobile, password: postBody.password
      };
      //注册成功自动登录
      var passportUser = yield passportModel.login(loginInfo);
      var tokenNo = yield tokenModel.putToken(loginInfo, passportUser);
      var result = {access_token:tokenNo, user:passportUser,msg:'登录成功'};
      //初始化p2p用户
      userModel.findUserByPassportUser(passportUser).then(function(user) {
        if(inviteCode) { //如果填写了邀请码
          tclog.notice({msg:"triggerInteract register", user:user.id, inviteCode:inviteCode});
          interactModel.triggerInteract(0, user.id, inviteCode, user.id);
        }
        tclog.notice({msg:"autoSendCoupon register", user:user.id});
        interactModel.autoSendCoupon(user.id);
      }).catch(function(err) {
        tclog.error({msg:"findUserByPassportUser error", err:err});
      });
      yield this.api(result);
    } catch (err) {
      tclog.warn({api:'/api/register', traceNo:traceNo, err:err});
      yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
    }
  },

  login4Social: function* () {
    var postBody = this.request.body;
    var headerBody = this.header;
    var sysCode = headerBody.syscode;
    var traceNo = this.req.traceNo+"";
    var socialType = postBody.socialType;
    var socialCode = postBody.socialCode;
    var appId = postBody.appId;
    try {
      var social_token = yield wechat.getAccessToken(socialCode);
      var social_user = yield wechat.getUserInfo(social_token.token, social_token.openId);
      var loginInfo = {
        source: headerBody.source, sysCode: sysCode, traceNo: traceNo,
        socialType: socialType, socialId: social_user.socialId, appId: appId, openId: social_token.openId
      };
      //日志输出不包含密码信息
      tclog.notice({api:'/api/login', loginInfo: _.omit(loginInfo)});
      var passportUser = yield passportModel.login4Social(loginInfo);
      var tokenNo = yield tokenModel.putToken(loginInfo, passportUser);
      passportUser.nickName = social_user.nickName;
      passportUser.headUrl = social_user.headUrl;
      var result = {access_token:tokenNo, user:passportUser,msg:'登录成功'};
      yield this.api(result);
    } catch (err) { //500
      if(err.err_code == 20021) { //社交账号未绑定
        wechat.saveToken(socialCode, social_user);
      }
      tclog.error({api:'/api/login', traceNo:traceNo, err:err});
      yield this.api_err({error_code : err.err_code, error_msg : err.err_msg});
    }
  },

  login4Sms: function* () {
    var headerBody = this.header;
    var postBody = this.request.body;
    var mobile = postBody.mobile;
    var socialCode = postBody.socialCode;
    var smsCaptcha = postBody.smsCaptcha;
    var traceNo = this.req.traceNo+"";

    try {
      //短信验证码是否正确
      var biz_type = captcha2Model.BIZ_TYPE.LOGIN;
      var validObj = {biz_type:biz_type, captcha:smsCaptcha, mobile:mobile};
      yield captcha2Model.validateSmsCaptcha(traceNo, validObj);

      var passportUser;
      try {
        //验证用户信息
        var userInfo = {
          source: headerBody.source, sysCode: headerBody.syscode, traceNo: traceNo,
          name: 'MOBILE', value: mobile
        };
        passportUser = yield passportModel.userInfo(userInfo);
      } catch (err) {
        if(err.err_code = 20010) {//用户不存在
          var regInfo = {
            source: headerBody.source, sysCode: headerBody.syscode, traceNo: traceNo,
            mobile: mobile
          };
          passportUser = yield passportModel.regNoPwd(regInfo);
          //TODO 触发活动
        } else { //其他错误
          throw err;
        }
      }

      if(socialCode) {//绑定社交账号
        var social_user = yield wechat.getToken(socialCode);
        var socialType = social_user.socialType;
        var socialInfo = {
          source: headerBody.source, sysCode: headerBody.syscode, traceNo: traceNo,
          userId: passportUser.id, socialType: socialType, socialId: social_user.socialId
        };
        yield passportModel.bindSocial(socialInfo);
        //TODO del social user
        var loginInfo = {
          source: headerBody.source, sysCode: headerBody.syscode, traceNo: traceNo,
          socialType: socialType, socialId: social_user.socialId, appId: social_user.appId, openId: social_user.openId
        };
        passportUser = yield passportModel.login4Social(loginInfo);
        var tokenNo = yield tokenModel.putToken(loginInfo, passportUser);
        passportUser.nickName = social_user.nickName;
        passportUser.headUrl = social_user.headUrl;
        yield this.api({access_token:tokenNo, user:passportUser,msg:'登录成功'});
      } else { //直接进行短信密码登陆
        var loginInfo = {source: headerBody.source, sysCode: headerBody.syscode, traceNo: traceNo};
        var tokenNo = yield tokenModel.putToken(loginInfo, passportUser);
        yield this.api({access_token:tokenNo, user:passportUser,msg:'登录成功'});
      }
    } catch (err) { //500
      tclog.error({api: '/api/login', traceNo: traceNo, err: err});
      yield this.api_err({error_code: err.err_code, error_msg: err.err_msg});
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
    };
    var result = yield tokenModel.removeToken(tokenInfo);
    tclog.notice({api:'/api/logout', traceNo:traceNo, result:result});
    yield this.api({access_token:tokenNo, msg:'退出成功'});
  }
};
