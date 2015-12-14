var app = require("./server");
var fs = require('fs');
var config = require('../conf');
var runEnv = config.runEnv;
var tclog = require('./libs/tclog.js');

var port = config.app.port || 8000;
app.init();
app.listen(port);
tclog.notice('UI Server已经启动：http://127.0.0.1:'+port);
// 启动后通过IO通知watch
if (runEnv === 'dev') {
  fs.writeFile('./pid', new Date().getTime());
}