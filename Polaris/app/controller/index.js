/**
 * @file index.js
 * @desc 控制器
 * @author xiaoguang01
 * @date 2015/9/25
 */
var tclog = require('../libs/tclog.js');

module.exports = {
  show: function *() {
    var self = this;
    yield self.render('user', {
      userInfo: self.userInfo || null,
      noWrap: false
    });
  }
};
