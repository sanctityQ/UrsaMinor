var ttypes = require("./gen-thrift/user_types.js");
var service = require("./gen-thrift/UserService.js");

var client = module.exports = {};

client.ttypes = ttypes;
client.service = service;