var _ = require('underscore');
var passportModel = require('../model/passport.js');
var userModel = require('../model/user.js');
var p2pModel = require("../model/p2p");

module.exports = {

  /**
   * 用户托管信息
   */
  userEscrow: function *() {
    var headerBody = this.header;
    var query = this.query;
    var tokenInfo = {source:'APP', syscode:'P2P', access_token: query.access_token};
    var passportUser = yield passportModel.tokenInfo(tokenInfo);
    var p2pUser = yield userModel.findUserByPassportUser(passportUser);
    var userEscrow = yield p2pModel.userEscrow(p2pUser.id);
    yield this.api(userEscrow);
  },

  /**
   * 用户资金模块
   */
  userFund: function *() {
    var headerBody = this.header;
    var query = this.query;
    var tokenInfo = {source:'APP', syscode:'P2P', access_token: query.access_token};
    var passportUser = yield passportModel.tokenInfo(tokenInfo);
    var p2pUser = yield userModel.findUserByPassportUser(passportUser);
    var userFund = yield p2pModel.userFund(p2pUser.id);
    yield this.api(userFund);
  }
};
