var ZK = require("zookeeper");
var async = require('async');
var _ = require("underscore");
var thrift = require("./thrift");
var loadbalance = require('loadbalance');
var EventEmitter = require('events').EventEmitter;
var util = require('util');

var EVENT_INIT = "init_success";
var client_map = {};

module.exports = ZKClient;

function buildZK(server) {
  var zk_config = {
    connect: server,
    timeout: 20000,
    debug_level: ZK.ZOO_LOG_LEVEL_WARN,
    host_order_deterministic: false
  };
  return new ZK(zk_config);
}

/**
 * ZKClient
 * @param server
 * @param path
 * @param service
 * @param options
 * @returns {ZKClient}
 * @constructor
 */
function ZKClient(server, path, service, options) {
  var self = this;
  this._server = server;
  this._path = path;
  this._service = service;
  this._options = options;
  return self;
}

util.inherits(ZKClient, EventEmitter);

ZKClient.prototype.init = function() {
  var self = this;
  
  var readFn = function (zk, child) {
    var fn = function(cb) {
      var fullPath = self._path + "/" + child;
      zk.a_get(fullPath, false, function(rc, error, stat, data) {
        var endPoint = JSON.parse(data.toString());
        var host = endPoint.serviceEndpoint.host;
        var port = endPoint.serviceEndpoint.port;
        var key = self._path + "-" + host + "-" + port;
        var client = client_map[key];
        if(!client) {
          client = thrift.genClient(host, port, self._service, self._options);
          client_map[key] = client;
        }
        cb(null, client);
      });
    };
    return fn;
  };

  //监听
  var start_listener = function (zk) {
    zk.aw_get_children(
        self._path,
        function (type, state, watched_path) {
          //zookeeper服务挂掉(type=-1 state=1)
          console.log("watch>>>>> type:" + type + ", state:" + state);
          if(type == -1) {
            if(state == 1) {
              //retry 自动切换服务重连
              zk.once(ZK.on_connected, function (zkk) {
                refresh_engine(zk);
              });
            } else if(state == 3) {
              console.log(">>>>>> retry success")
            }
          } else {
            console.log(">>>>>> refresh_engine")
            refresh_engine(zk);
            var zk_new = buildZK(self._server);
            zk_new.connect(function (err) {
              start_listener(zk_new);
              zk.close();
            })
          }
        },
        function (rc, err, children) {
        }
    );
  };

  //刷新pool
  var refresh_engine = function (zk, initFlag) {
    zk.a_get_children(
        self._path,
        false,
        function (rc, err, children) {
          var batched = {};
          _.each(children, function (child) {
            batched[child] = readFn(zk, child);
          });
          async.parallel(batched, function (err, results) {
            var thrift_pool = _.map(results, function (value, i) {
              return value;
            });
            console.log("refresh pool success " + self._path + ">>pool size:" + thrift_pool.length);
            self._engine = new loadbalance.RoundRobinEngine(thrift_pool);
            if(initFlag) { //初始化成功
              start_listener(zk); //启动监听器
              self.emit(EVENT_INIT, zk);
            }
          });
        }
    );
  };

  var zk = buildZK(self._server);

  //TODO 链接超时处理
  zk.connect(function (err) {
    //初始化配置
    refresh_engine(zk, true);
  });
  
  var init_promise = new Promise(function (resolve, reject) {
    self.once(EVENT_INIT, function (zk) {
      resolve("success");
    })
  });
  
  _.each(_.keys(self._service.Client.prototype), function (key) {
    self[key] = function (...args) {
      if(self._engine) {
        //选取client
        var client = self._engine.pick();
        if(client) {
          client[key].apply(client, args);
        } else {
          args[args.length - 1].call(this, new Error("CONNECT ERROR"), null);
        }
      } else {
        init_promise.then(function (obj) {
          var client = self._engine.pick();
          if(client) {
            client[key].apply(client, args);
          } else {
            args[args.length - 1].call(this, new Error("CONNECT ERROR"), null);
          }
        })
      }
    }
  });
  return self;
};