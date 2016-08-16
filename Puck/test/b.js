var Puck = require("../index")
var thrift = require("thrift");

var hello = require("./gen-nodejs/Hello")

// var client = new Puck(hello).newIface("127.0.0.1:8080");


// setInterval(function () {
//   client.findUserById("00DA6154-D853-42F8-AEAF-6F59F61AF1B2", function (err, value) {
//     if(err) {
//       console.log(err)
//     } else {
//       console.log("success>>" + value.name)
//     }
//   });
// }, 500);
var transport = thrift.TFramedTransport;
var protocol = thrift.TBinaryProtocol;
var connection = thrift.createConnection("127.0.0.1",8080,{
  transport:transport,
  protocol:protocol
});

var client = thrift.createClient(hello,connection);

// client.__can__finagle__trace__v3__();

client.hi(function (err, value) {
  console.log(value)
});
//
// client.hi(function (err, value) {
//   console.log(value)
// });