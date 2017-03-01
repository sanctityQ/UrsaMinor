var request = require("request");

module.exports = {

  userEscrow: function (userId) {
    //http://192.168.0.244:8888/api/v2/user/2529EC61-FBC3-4C46-AD06-DEC3B5D9F65F/userfund
    return new Promise(function (resolve, reject) {
      request('http://192.168.0.240:8888/api/v5/user/escrow/'+userId, function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var result = JSON.parse(body);
          resolve(result.data);
        }
      });
    });
  },

  userFund: function (userId) {
    return new Promise(function (resolve, reject) {
      request('http://192.168.0.240:8888/api/v2/user/'+userId+'/userfund', function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var result = JSON.parse(body);
          resolve(result);
        }
      });
    });
  }
};