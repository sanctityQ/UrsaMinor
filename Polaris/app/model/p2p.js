var request = require("request");

module.exports = {

  userEscrow: function (userId) {
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
  },

  investStatistics: function (userId) {
    return new Promise(function (resolve, reject) {
      request('http://192.168.0.240:8888/api/v2/user/'+userId+'/statisticsAPP/invest', function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var result = JSON.parse(body);
          resolve(result);
        }
      });
    });
  },

  investStatistics2: function (userId) {
    return new Promise(function (resolve, reject) {
      request('http://192.168.0.240:8888/api/v2/user/'+userId+'/statistics/invest', function (error, response, body) {
        if (!error && response.statusCode == 200) {
          var result = JSON.parse(body);
          resolve(result);
        }
      });
    });
  }
};