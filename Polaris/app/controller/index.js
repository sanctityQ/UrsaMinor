/**
 * @file index.js
 * @desc 控制器
 * @author xiaoguang01
 * @date 2015/9/25
 */
var tclog = require('../libs/tclog.js');

module.exports = {
  show: function *() {
    yield this.api('true');
  }
};
