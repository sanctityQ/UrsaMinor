/**
 * @file bootStrap.js
 * @desc 程序入口
 * @author xiaoguang01
 * @date 2015/9/25
 */
var config = require('../conf');
var koa = require('koa');
var view = require('zeus-template');
var router = require('./router');
var app = koa();
var runEnv = config.runEnv;
var bodyParser = require('koa-bodyparser');
//var session = require('koa-generic-session');
//var redisStore = require('koa-redis');
var tclog = require('./libs/tclog.js');
var genLogid = require('./libs/logid').genLogid;
var api = require('./libs/api');

module.exports = app;

module.exports.init = function() {
  //app.keys = ['tiancai', 'xiaoguang'];

  app.use(function *(next) {
    if (this.url == '/favicon.ico') {
      //favicon return
    } else {
      yield next;
    }
  });

// 设置模板
  view(app, config.view);

// 设置api
  api(app);
  app.use(require('koa-static')(config.statics.staticRoute));
  app.use(bodyParser());
  tclog.init();
// live-reload代理中间件
  if (runEnv === 'dev') {
    app.use(function *(next) {
      yield next;
      if (this.type === 'text/html') {
        this.body += yield this.toHtml('reload');
      }
    });
  }

  //var redis = redisStore({host: config.redis.host, port: config.redis.port});

  //app.redisIsOk = true;
  //redis.on('disconnect', function () {
  //  app.redisIsOk = false;
  //});
  //app.use(session({store: redis}));

  app.use(function *(next) {
    var traceNo = genLogid();
    this.req.traceNo = traceNo;
    //if (app.redisIsOk) {
    //  var tiancainame = this.cookies.get('tiancainame', {signed: true});
    //  try {
    //    var userInfo = this.session[tiancainame];
    //    this.userInfo = userInfo;
    //  }
    //  catch (e) {
    //    this.userInfo = null;
    //  }
    //} else {
    //  this.userInfo = null;
    //}

    tclog.notice({traceNo: traceNo, type: 'pv', method: this.req.method, url: this.url, userInfo: this.userInfo});
    yield next;
  });

// 设置路由
  router(app);

  app.use(function *error(next) {
    if (this.status === 404) {
      var url = this.url;
      if (url && url.length > 4 && url.substring(0, 4) == '/api') {
        this.type = 'json';
        this.status = 404;
        this.body = JSON.stringify({error_code:404, error_msg:"资源不存在"});
      } else {
        yield this.render('error/404', {noWrap: true});
      }
    } else {
      yield next;
    }
  });
};