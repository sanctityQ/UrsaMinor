var factory = require("../libs/client_factory.js")
var ttypes = factory.passport_types.ttypes;

var user_ttypes = factory.user_types.ttypes;

var header = new factory.passport_types.ttypes.RequestHeader({
  source: ttypes.Source['APP'],
  sysCode: ttypes.SysCode['P2P'],
  traceNo: '13213123'
});

var request = new factory.passport_types.ttypes.UserInfoRequest({
  header: header,
  name: ttypes.PropName['USERID'],
  value: '1195'
});

//factory.passport_client.userInfo(request, function(err, response) {
//  var userInit = new user_ttypes.UserInit({
//    mobile: response.mobile,
//    loginName: response.loginName,
//    passportId:response.id,
//    source: user_ttypes.Source.WEB,
//    registerDate:response.registerDate
//  });
//
//  factory.user_client.initUser(userInit, function(err, response) {
//    console.log(err)
//    console.log(response)
//  });
//});


var action = new factory.interact_types.ttypes.InteractAction({
  activeType:0,
  activeValue:"",
  inviterCode:"TFS112",
  userId:"010E72F8-5F92-41E2-897E-A794321E4BA6"
});
factory.interact_client.interactActiveDeal(action, function(err, response) {
  if(err) {
    console.log("aaaaa"+err)
  } else {
    console.log("bbbb"+response);
  }
});

//factory.user_client.findUserByPassportId(117, function(err, response) {
//  console.log(err)
//  console.log(response)
//});

