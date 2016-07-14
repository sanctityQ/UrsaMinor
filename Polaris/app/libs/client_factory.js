var Redis = require("ioredis");
var config = require('../../conf/index');
var tclog = require('../libs/tclog.js');
var apiCode = require("../conf/ApiCode.js");
var ex_utils = require('../libs/exception.js');

//var cluster = new Redis.Cluster([{
//  port: 6380,
//  host: '127.0.0.1'
//}, {
//  port: 6381,
//  host: '127.0.0.1'
//}]);
Redis.Promise.onPossiblyUnhandledRejection(function (error) {
  tclog.error({msg:"Redis Error", error:error});
  throw ex_utils.buildCommonException(apiCode.E10001);
});
var redis_client = new Redis(config.redis);

var thrift_conf = config.thirft;
var Puck = require("@itiancai/Puck");
var passport_types = require("@itiancai/passport-client");
var notification_types = require("@itiancai/notification-client-node");

var passport_client = new Puck(passport_types.PassportService, thrift_conf.passport.options).newIface(thrift_conf.passport.url);
var sms_client = new Puck(notification_types.SmsApi, thrift_conf.notifaction.options).newIface(thrift_conf.notifaction.url);

module.exports = {
  redis_client : redis_client,

  passport_client : passport_client,
  passport_types : passport_types,

  sms_client : sms_client,
  notification_types :notification_types
};