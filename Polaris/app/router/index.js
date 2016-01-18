/**
 * @file index.js
 * @desc router配置
 * @author xiaoguang01
 * @date 2015/9/25
 */
var router = require('koa-router')();
var ctrs = [];
function getC(app) {
  return new Promise(function (resovel, reject) {
    try {
      ctrs = require('../libs/ctrs.js').getCtrs();
      resovel(ctrs);
    }
    catch (e) {
      reject(e);
    }
  });
}

function set(app) {
  app.use(router.routes());
  getC(app).then(function (ctrs) {
    setMap(ctrs);
  }).catch(function (e) {
    console.log(e);
  });
}

function setMap(ctrs) {
  router.get('/', ctrs.index.show);
  router.get('/index', ctrs.index.show);

  //验证码
  router.get('/api/captcha/img', ctrs.captcha.genImg);
  //type:(sms|sound)
  router.post('/api/captcha/:type/:biz', ctrs.captcha.sendSmsCaptcha);
  //router.post('/api/captcha/:type/resetPassword', ctrs.captcha.sendSms4ResetPassword);

  //router.post('/api/captcha2/:type/', ctrs.captchanew.sendSmsCaptcha);
  //router.post('/api/captcha/sound/register', ctrs.captcha.sendSound4Register);
  //router.post('/api/captcha/sound/resetPassword', ctrs.captcha.sendSound4ResetPassword);

  //主流程
  router.post('/api/login', ctrs.api.login);
  router.post('/api/register', ctrs.api.register);
  router.get('/api/logout', ctrs.api.logout);

  //验证手机号
  router.get('/api/check/mobile', ctrs.check.checkMobile);

  //重置密码
  router.post('/api/password/reset', ctrs.password.reset);
  //修改密码
  router.post('/api/password/change', ctrs.password.change);
  router.post('/api/password/check', ctrs.password.check);
}
module.exports = set;
