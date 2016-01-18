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
var thrift = require('thrift');
var thrift_pool = require("node-thrift-pool");
var passport_types = require("@itiancai/passport-client");
var notification_types = require("@itiancai/notification-client-node");

var passport_settings = {
  host: thrift_conf.passport.host,
  port: thrift_conf.passport.port
};

var notification_settings = {
  host: thrift_conf.notifaction.host,
  port: thrift_conf.notifaction.port
};

var options = {
  transport: thrift.TFramedTransport,
  protocol: thrift.TBinaryProtocol
};
var passport_client = thrift_pool(thrift, passport_types.PassportService, passport_settings, options);
var sms_client = thrift_pool(thrift, notification_types.SmsApi, notification_settings, options);

module.exports = {
  redis_client : redis_client,

  passport_client : passport_client,
  passport_types : passport_types,

  sms_client : sms_client,
  notification_types :notification_types
};