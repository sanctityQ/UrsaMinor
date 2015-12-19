/**
 * @file config.js
 * @desc 开发环境配置
 * @author xiaoguang01
 * @date 2015/9/25
 */
"use strict";
var path = require('path');
module.exports = {
  // 当前运行模式
  runEnv: 'online',

  // 应用全局配置
  app: {
    port: 9980,
    httpAgentMaxSocks: 30000
  },

  statics: {
    basePath: 'http://127.0.0.1/client/',
    staticRoute: 'client/src'
  },

  // 文本宏
  consts: {
    siteName: '甜菜金融'
  },

  // 模板引擎相关配置
  view: {
    root: path.join(__dirname, '../app/template'),
    layout: 'layout',
    viewExt: 'html',
    cache: false,
    debug: true,
    useLess: true
  },

  // 日志相关配置
  log: {
    path: './log/tiancai.log',
    maxLength: 3000,
    level: 1, // [ 1-debug, 2-trace, 3-notice, 4-warn, 5-fatal ]
    printTty: true,
    printFile: true,
    redictConsole: true
  },

  // 后端连接相关配置
  thirft: {
    passport: {
      host: '127.0.0.1',
      port: 9982,
      timeout: 3000,
      max_connections: 100,
      min_connections: 10
    }
  },

  // redis连接相关配置
  redis: {
    port: 6379,
    host: '127.0.0.1',
    options: {
      connectTimeout: 1000,
      //重试策略为每次递增200ms，最多3次
      retryStrategy: function (times) {
        if (times > 3) {
          return false;
        }
        return times * 200;
      }
    }
  },

  captcha: {
    sms: {
      redis: {
        host:'192.168.0.244',
        port: 6379,
        options: {
          connectTimeout: 1000,
          //重试策略为每次递增200ms，最多3次
          retryStrategy: function (times) {
            if (times > 3) {
              return false;
            }
            return times * 200;
          }
        }
      },
      server: 'http://192.168.0.244:8888',
      path4Register : "/api/v2/users/smsCaptcha",
      path4ResetPassword : "/api/v2/auth/resetpwd/smscaptcha/send",
      path4Sound : "/api/v2/auth/soundcaptcha/send",
      path4ValidateRegister: "/api/v2/users/register/check/smscaptcha",
      path4ValidateResetPassword : "/resetpwd/smscaptcha/check"
    },
    img: {
      server: "http://192.168.0.243:8083",
      path : "/captcha"
    }
  },

  session: {
    key: 'itiancai.sid',
    prefix: 'passport:sess:'
  }
}
