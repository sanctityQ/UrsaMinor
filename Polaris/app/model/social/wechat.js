'use strict';

var rp = require('request-promise');
var client_factory = require("../../libs/client_factory");
var apiCode = require("../../conf/ApiCode.js");
var ex_utils = require('../../libs/exception.js');
var redis_client = client_factory.redis_client;

module.exports = {
  //甜菜服务号
  APPID: 'wxb25edf2a7bb16755',
  SECRET: 'ff6a25d5b6766fbadcffa4a845e9725b',
  //通过code换取网页授权access_token
  getAccessToken: function(code) {
    //https://api.weixin.qq.com/sns/oauth2/access_token?appid=APPID&secret=SECRET&code=CODE&grant_type=authorization_code
    var url = 'https://api.weixin.qq.com/sns/oauth2/access_token?';
    var param = ['appid=', this.APPID, '&secret=', this.SECRET, '&code=', code, '&grant_type=authorization_code'];
    return new Promise(function (resolve, reject) {
      rp(url + param.join('')).then(function (token_) {
        var token = JSON.parse(token_);
        if(token.access_token) {
          resolve({token: token.access_token, socialId: token.unionid, openId:token.openid});
        } else {
          resolve({token:"social_token1", socialId:"social1", openId:"open1"});
        }
      });
    });
    
  },
  //拉取用户信息(需scope为 snsapi_userinfo)
  getUserInfo: function(token, openid) {
    var url = 'https://api.weixin.qq.com/sns/userinfo?access_token=' + token + '&openid=' + openid + '&lang=zh_CN';
    return new Promise(function (resolve, reject) {
      rp(url).then(function (user_) {
        var user = JSON.parse(user_);
        if(user.unionid) {
          resolve({nickName:user.nickname, headUrl:user.headimgurl, socialType:"WeChat", socialId:user.unionid, appId: "wxb25edf2a7bb16755", openId:user.openid});
        } else {
          resolve({nickName:"nick1", headUrl:"url1", socialType:"WeChat", socialId:"social1", appId: "wxb25edf2a7bb16755", openId:"open1"});
        }
      });
    });
  },
  
  saveToken: function (code, token) {
    redis_client.setex("social:"+code, 24*60*60, JSON.stringify(token));
  },

  getToken: function (code) {
    return new Promise(function (resolve, reject) {
      redis_client.get("social:"+code, function(err, result) {
        if(err) {
          tclog.error({traceNo:traceNo, tokenNo:tokenNo, err_msg:"getToken error", err:err});
          reject(ex_utils.buildCommonException(apiCode.E10001));
        } else {
          if(result) { //token有效
            var token = JSON.parse(result);
            resolve(token);
          } else { //token失效
            reject(ex_utils.buildCommonException(apiCode.E20099));
          }
        }
      })
    });
  }
};