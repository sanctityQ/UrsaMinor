/**
 * @file user.js
 * @desc 用户模型
 * @author xiaoguang01
 * @date 2015/9/27
 */
var thrift = require('thrift');
var PassportService = require('./thrift/PassportService');
var ttypes = require('./thrift/passport_types');
var thrift_pool = require("node-thrift-pool");
var thrift_conf = require('../../conf').thirft.passport;
var apiCode = require("../conf/ApiCode.js");
var tclog = require('../libs/tclog.js');
var _ = require('underscore');

var transport = thrift.TFramedTransport;
var protocol = thrift.TBinaryProtocol;
var settings = {
  host : thrift_conf.host,
  port : thrift_conf.port,
  log: false
};
var options = {
  transport : transport,
  protocol : protocol,
  idle_timeout : thrift_conf.timeout,
  max_connections : thrift_conf.max_connections,
  min_connections : thrift_conf.min_connections
};
var client = thrift_pool(thrift, PassportService, settings, options);

module.exports = {
  //登陆
  login: function (loginInfo) {
    return new Promise(function (resovel, reject) {
      var request = false;
      try {
        request = new ttypes.LoginRequest({
          header: new ttypes.RequestHeader({
            source: ttypes.Source[loginInfo.source],
            sysCode: ttypes.SysCode[loginInfo.sysCode],
            traceNo: loginInfo.traceNo
          }),
          credential: loginInfo.credential,
          password: loginInfo.password
        });
        tclog.notice({info:'passportModel login begin', request: request});
      } catch(err) {
        tclog.error({
          logid: loginInfo.traceNo,
          loginInfo: loginInfo,
          err: err
        });
        resovel( {header: apiCode.E20098} );
      }
      if(request) {
        client.login(request, function (err, response) {
          if (err) { //网络中断或Exception
            tclog.error({
              logid: loginInfo.traceNo,
              err: err //错误信息
            });
            resovel({header: apiCode.E10001});
          } else {
            //用户信息Long字段特殊处理
            response.user = _.mapObject(response.user, function(val, key) {
              return val.valueOf();
            });
            response.source = request.header.source;
            response.sysCode = request.header.sysCode;
            resovel(response);
          }
        })
      }
    });
  },

  //注册
  register: function (registerInfo) {
    //手机号、密码、渠道、必传
    return new Promise(function (resovel, reject) {
      var request = false; //请求信息默认false
      try {
        //初始化请求信息
        request = new ttypes.RegRequest({
          header: new ttypes.RequestHeader({
            source: ttypes.Source[registerInfo.source],
            sysCode: ttypes.SysCode[registerInfo.sysCode],
            traceNo: registerInfo.traceNo
          }),
          mobile: registerInfo.mobile,
          password: registerInfo.password
        });
      } catch(err) { //参数错误
        //输出参数日志
        tclog.error({
          logid: registerInfo.traceNo,
          loginInfo: registerInfo,
          err: err
        });
        //请求参数异常
        resovel( {header: apiCode.E20098} );
      }
      if(request) { //创建request成功
        client.reg(request, function (err, response) { //调用注册接口
          if (err) {
            tclog.error({
              logid: registerInfo.traceNo,
              err: err
            });
            resovel({header: apiCode.E10001})
          } else {
            resovel(response);
          }
        })
      }
    });
  },

  /**
   * 用户信息验证
   * @param validateInfo
   * @returns {Promise}
   */
  userValidate: function(validateInfo) {
    return new Promise(function (resovel, reject) {
      var request = false;
      try {
        request = new ttypes.UserValidateRequest({
          header: new ttypes.RequestHeader({
            source: ttypes.Source[validateInfo.source],
            sysCode: ttypes.SysCode[validateInfo.sysCode],
            traceNo: validateInfo.traceNo
          }),
          name: ttypes.ValidateName[validateInfo.name],
          value: validateInfo.value
        });
      } catch(err) {
        //构建request错误
        tclog.error({
          logid: validateInfo.traceNo,
          validateInfo: validateInfo,
          err: err
        });
        resovel( {header: apiCode.E20098} );
      }
      if(request) {
        client.userValidate(request, function (err, response) {
          if (err) {
            tclog.error({
              logid: validateInfo.traceNo,
              err: err
            });
            resovel({header: apiCode.E10001});
          } else {
            resovel(response);
          }
        })
      }
    });
  }
}
