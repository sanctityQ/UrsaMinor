var app = require("./server");
var fs = require('fs');
var config = require('../conf');
var runEnv = config.runEnv;
var tclog = require('./libs/tclog.js');

app.init();
app.listen(8000);
tclog.notice('UI Server已经启动：http://127.0.0.1:8000');
// 启动后通过IO通知watch
if (runEnv === 'dev') {
  fs.writeFile('./pid', new Date().getTime());
}