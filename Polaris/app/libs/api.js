/**
 * @file json.js
 * @desc 程序入口
 * @author xiaoguang01
 * @date 2015/10/09
 */

function api(app, settings) {
  app.context.api = function *(obj) {
    this.type = 'json';
    this.body = JSON.stringify(obj);
  };

  app.context.api_err = function *(obj) {
    this.type = 'json';
    this.status = 500;
    this.body = JSON.stringify(obj);
  };

  app.context.api_404 = function *() {
    this.type = 'json';
    this.status = 404;
    this.body = JSON.stringify({error_code:404, error_msg:"资源不存在"});
  };
}

module.exports = api;
