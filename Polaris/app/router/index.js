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

  router.get('/api/captcha/img', ctrs.captcha.sendImg);
  router.get('/api/captcha/sms/register', ctrs.captcha.sendSms4Register);
  router.get('/api/captcha/sound/register', ctrs.captcha.sendSound4Register);
  router.get('/api/captcha/sms/resetPassword', ctrs.captcha.sendSms4ResetPassword);
  router.get('/api/captcha/sound/resetPassword', ctrs.captcha.sendSound4ResetPassword);

  router.post('/api/login', ctrs.api.login);
  router.get('/api/logout', ctrs.api.logout);
  router.post('/api/register', ctrs.api.register);

  // /api/password/forget 忘记密码
  // /api/password/forget
  router.get('/api/check/mobile', ctrs.check.checkMobile);
}
module.exports = set;
