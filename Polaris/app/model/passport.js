/**
 * @file user.js
 * @desc 用户模型
 * @author xiaoguang01
 * @date 2015/9/27
 */
var thrift = require('thrift');
var passportTypes = require("@itiancai/passport-client");
var PassportService = passportTypes.PassportService;
var common_types = passportTypes.common_types;
var ttypes = passportTypes.ttypes;
var thrift_pool = require("node-thrift-pool");
var thrift_conf = require('../../conf').thirft.passport;
var tclog = require('../libs/tclog.js');
var _ = require('underscore');

var transport = thrift.TFramedTransport;
var protocol = thrift.TBinaryProtocol;
var settings = {
  host: thrift_conf.host,
  port: thrift_conf.port
};
var options = {
  transport: transport,
  protocol: protocol
};
var client = thrift_pool(thrift, PassportService, settings, options);

/**
 * 构建RequestHeader
 * @param requestInfo
 * @returns {exports.RequestHeader}
 */
function buildHeader(requestInfo) {
  return new ttypes.RequestHeader({
    source: ttypes.Source[requestInfo.source],
    sysCode: ttypes.SysCode[requestInfo.sysCode],
    traceNo: requestInfo.traceNo
  });
}

/**
 * 构建PassportException
 * @param errCode
 * @returns {exports.PassportException}
 */
function buildPassportException(errCode) {
  var err_msg = common_types.msg_map[errCode];
  return new common_types.PassportException({
    err_code: errCode,
    err_msg: err_msg
  });
}

/**
 * 处理错误
 * @param requestInfo
 * @param err
 * @returns {*}
 */
function handleError(requestInfo, err) {
  console.log(err);
  tclog.error({logid: requestInfo.traceNo, requestInfo: requestInfo, err: err});
  if(err instanceof common_types.PassportException) { //passport系统异常
    return err; //直接返回
  } else if(err instanceof Error) { //其他错误 转换为PassportException
    if(err.name == 'TProtocolException') { //thrift.TProtocolException
      return buildPassportException(common_types.ErrCode.E20098); //参数错误
    } else { //链接错误 connection error
      return buildPassportException(common_types.ErrCode.E10001);
    }
  }
}

module.exports = {
  //登陆
  login: function (loginInfo) {
    return new Promise(function (resolve, reject) {
      var request = false;
      try {
        request = new ttypes.LoginRequest({
          header: buildHeader(loginInfo),
          credential: loginInfo.credential,
          password: loginInfo.password
        });
        tclog.notice({info: 'passportModel login begin', request: request});
      } catch (err) {
        reject(handleError(loginInfo, err));
      }
      if (request) {
        client.login(request, function (err, response) {
          if (err) { //网络中断或Exception
            reject(handleError(loginInfo, err));
          } else {
            //用户信息Long字段特殊处理
            var passportUser = _.mapObject(response, function (val, key) {
              return val.valueOf();
            });
            resolve(passportUser);
          }
        })
      }
    });
  },

  //注册
  register: function (registerInfo) {
    //手机号、密码、渠道、必传
    return new Promise(function (resolve, reject) {
      var request = false; //请求信息默认false
      try {
        //初始化请求信息
        request = new ttypes.RegRequest({
          header: buildHeader(registerInfo),
          mobile: registerInfo.mobile,
          password: registerInfo.password
        });
      } catch (err) { //参数错误
        //输出参数日志
        reject(handleError(registerInfo, err));
      }
      if (request) { //创建request成功
        client.reg(request, function (err, response) { //调用注册接口
          if (err) {
            reject(handleError(registerInfo, err));
          } else {
            //用户信息Long字段特殊处理
            var passportUser = _.mapObject(response, function (val, key) {
              return val.valueOf();
            });
            resolve(passportUser);
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
  userValidate: function (validateInfo) {
    return new Promise(function (resolve, reject) {
      var request = false;
      try {
        request = new ttypes.UserValidateRequest({
          header: buildHeader(validateInfo),
          name: ttypes.PropName[validateInfo.name],
          value: validateInfo.value
        });
      } catch (err) {
        //构建request错误
        reject(handleError(validateInfo, err));
      }
      if (request) {
        client.userValidate(request, function (err, response) {
          if (err) {
            reject(handleError(validateInfo, err));
          } else {
            resolve(response);
          }
        })
      }
    });
  },

  /**
   * 重置密码
   * @param resetInfo
   * @returns {Promise}
   */
  resetPassword: function (resetInfo) {
    return new Promise(function (resolve, reject) {
      var request = false;
      try {
        request = new ttypes.ResetPasswordRequest({
          header: buildHeader(resetInfo),
          mobile: resetInfo.mobile
        });
      } catch (err) {
        //构建request错误
        reject(handleError(resetInfo, err));
      }
      if (request) {
        client.resetPassword(request, function (err, response) {
          if (err) {
            reject(handleError(resetInfo, err));
          } else {
            resolve(response);
          }
        })
      }
    });
  },

  /**
   * 修改密码
   * @param changeInfo
   * @returns {Promise}
   */
  changePassword: function (changeInfo) {
    return new Promise(function (resolve, reject) {
      var request = false;
      try {
        request = new ttypes.ChangePasswordRequest({
          header: buildHeader(changeInfo),
          userId: new thrift.Int64(changeInfo.userId),
          oldPasword: changeInfo.oldPassword,
          password: changeInfo.password
        });
      } catch (err) {
        //构建request错误
        reject(handleError(changeInfo, err));
      }
      if (request) {
        client.changePassword(request, function (err, response) {
          if (err) {
            reject(handleError(changeInfo, err));
          } else {
            resolve(response);
          }
        })
      }
    });
  },

  /**
   * 查询用户信息
   * @param userInfo
   * @returns {Promise}
   */
  userInfo: function(userInfo) {
    return new Promise(function (resolve, reject) {
      var request = false;
      try {
        request = new ttypes.UserInfoRequest({
          header: buildHeader(userInfo),
          name: ttypes.PropName[userInfo.name],
          value: userInfo.value
        });
      } catch (err) {
        //构建request错误
        reject(handleError(userInfo, err));
      }
      if (request) {
        client.userInfo(request, function (err, response) {
          if (err) {
            reject(handleError(userInfo, err));
          } else {
            resolve(response);
          }
        })
      }
    });
  }
}
