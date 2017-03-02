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
    var traceNo = this.req.traceNo+"";
    var query = this.query;
    var tokenReq = {source:'APP', sysCode:'P2P', traceNo: traceNo, access_token: query.access_token};
    var tokenInfo = yield passportModel.tokenInfo(tokenReq);
    var userReq = {source: 'APP', sysCode: 'P2P', traceNo: traceNo, name: 'USERID', value: tokenInfo.uid+""};
    var passportUser = yield passportModel.userInfo(userReq);
    var p2pUser = yield userModel.findUserByPassportUser(passportUser);
    var userEscrow = yield p2pModel.userEscrow(p2pUser.id);
    yield this.api(userEscrow);
  },

  /**
   * 用户资金模块
   */
  userFund: function *() {
    var headerBody = this.header;
    var traceNo = this.req.traceNo+"";
    var query = this.query;
    var tokenReq = {source:'APP', sysCode:'P2P', traceNo: traceNo, access_token: query.access_token};
    var tokenInfo = yield passportModel.tokenInfo(tokenReq);
    var userReq = {source: 'APP', sysCode: 'P2P', traceNo: traceNo, name: 'USERID', value: tokenInfo.uid+""};
    var passportUser = yield passportModel.userInfo(userReq);
    var p2pUser = yield userModel.findUserByPassportUser(passportUser);
    var userFund = yield p2pModel.userFund(p2pUser.id);
    var investStatistics = yield p2pModel.investStatistics(passportUser.id);
    var investStatistics2 = yield p2pModel.investStatistics2(p2pUser.id);
    userFund.currentIncome = investStatistics2.currentIncome;
    userFund.obtainIncome = investStatistics2.investInterestAmount;
    userFund.investAmount = (investStatistics.investStatistics.totalAmount/100).toFixed(2);
    yield this.api(userFund);
  }
};
