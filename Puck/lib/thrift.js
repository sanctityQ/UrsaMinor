var thrift = require('thrift');
var thrift_pool = require("node-thrift-pool");
var _ = require("underscore");

var thrift_options = {
  transport: thrift.TFramedTransport,
  protocol: thrift.TBinaryProtocol
};

module.exports.genClient = function (host, port, service, options) {
  var settings = _.defaults(
      {
        host: host,
        port: port,
        max_connections: options.max_connections,
        min_connections: options.min_connections,
        idle_timeout: options.idle_timeout
      }, {
        max_connections: 1,
        min_connections: 0,
        idle_timeout: 30000
      }
  );
  console.log("genClient[host:%s port:%s]", host, port);
  return thrift_pool(thrift, service, settings, thrift_options);
};