var thrift = require('./thrift');
var _ = require("underscore");
var ZKClient = require("./ZKClient");
var loadbalance = require('loadbalance');
var zk_regx = /^zk!.*!.*$/;

exports = module.exports = Puck;

function Puck(service, options) {
  var self = this;
  this._options = options;
  this._service = service;
  return self;
}

Puck.prototype.newIface = function (dest) {
  if(zk_regx.test(dest)) {
    var label = dest.split("!");
    if(label.length != 3) {
      throw new Error("can't resolve dest")
    } 
    var zkAddr = label[1];
    var path = label[2];
    return new ZKClient(zkAddr, path, this._service, this._options).init();
  } else {
    var label = dest.split(":");
    if(label.length != 2) {
      throw new Error("can't resolve dest")
    }
    var host = label[0];
    var port = label[1];
    return thrift.genClient(host, port, this._service, this._options);
  }
};
