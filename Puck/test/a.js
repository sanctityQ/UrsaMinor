var Puck = require("../index")

var userService = require("./thrift/index")

var options = {max_connections:100, min_connections: 50};
var client = new Puck(userService.service, options).newIface("zk!127.0.0.1:2181,127.0.0.1:2182,127.0.0.1:2183!/services/user");
// var client = new Puck(userService.service).newIface("127.0.0.1:9960");

var count = 0;
var s = new Date().getTime();

setInterval(function () {
  var start = new Date().getTime();
  client.findUserById("00DA6154-D853-42F8-AEAF-6F59F61AF1B2", function (err, value) {
    if(err) {
      console.log(err)
    } else {
      // count += 1;
      // var end = new Date().getTime();
      // console.log("count>>>>"+count);
      // var s2 = end - s;
      // console.log("success>>" + value.name + ", s2:" + s2)
    }
  });
}, 500);

