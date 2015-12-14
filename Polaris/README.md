# UrsaMinor API
`主流程(login、register...)`和`验证码captcha(sms、sound)`

##主流程
###/api/check/mobile
+ GET
+ Params

| Scope         | name            | des           |
|:------------- |:--------------- |:------------- |
| header        | source          |渠道来源        |
|               | syscode         |系统代码        |
| query         | mobile          |手机号          |
+ response

```
{header:{err_code:0, err_msg:'成功'}}
{header:{err_code:20001, err_msg:'手机号已被使用'}}
{header:{err_code:20002, err_msg:'手机号格式错误'}}
```

###/api/register
+ POST
+ Params

| Scope         | name            | des           |
|:------------- |:--------------- |:------------- |
| header        | source          |渠道来源        |
|               | syscode         |系统代码        |
| body          | mobile          |手机号          |
|               | password        |密码            |
|               | smsCaptcha      |注册验证码       |
+ response

```
{header:{err_code:0, err_msg:'成功'}, access_token:0acaedd488a4c75a6f891037049aea10aeca34ce31dfd38931584802377a2605}
{header:{err_code:20006, err_msg:"短信验证码错误"}}
```
###/api/login
+ POST
+ Params

| Scope         | name            | des           |
|:------------- |:--------------- |:------------- |
| header        | source          |渠道来源        |
|               | syscode         |系统代码        |
| body          | credential      |登录凭证        |
|               | password        |密码            |
+ response

```
{header:{err_code:0, err_msg:'成功'}, access_token:0acaedd488a4c75a6f891037049aea10aeca34ce31dfd38931584802377a2605}
{header:{err_code:20007, err_msg:"登录失败，账号或密码错误"}}
{header:{err_code:20005,err_msg:"至少 6 位密码，不能包含空字符"}}
```
## captcha
###/api/captcha/sms
+ GET
+ Params

| Scope         | name            | des           |
|:------------- |:--------------- |:------------- |
| header        | source          |渠道来源        |
|               | syscode         |系统代码        |
| query         | mobile          |手机号          |
+ response

```
{header:{err_code:0, err_msg:'成功'}}
```
###/api/captcha/sound
+ GET
+ Params

| Scope         | name            | des           |
|:------------- |:--------------- |:------------- |
| header        | source          |渠道来源        |
|               | syscode         |系统代码        |
| query         | mobile          |手机号          |
+ response

```
{header:{err_code:0, err_msg:'成功'}}
```
## 附录
### Api Code
```
SUCCESS : {err_code:0, err_msg:"成功"},
E10001 : {err_code:10001, err_msg:"服务异常"},
E20000 : {err_code:20000, err_msg:"用户保存失败"},
E20001 : {err_code:20001, err_msg:"手机号已被使用"},
E20002 : {err_code:20002, err_msg:"手机号格式错误"},
E20003 : {err_code:20003, err_msg:"用户名已存在"},
E20004 : {err_code:20004, err_msg:"用户名格式错误"},
E20005 : {err_code:20005, err_msg:"至少 6 位密码，不能包含空字符"},
E20006 : {err_code:20006, err_msg:"短信验证码错误"},
E20007 : {err_code:20007, err_msg:"登录失败，账号或密码不能为空"},
E20008 : {err_code:20008, err_msg:"登录失败，账号或密码错误"},
E20009 : {err_code:20009, err_msg:"登录失败，账号已禁用"},
E20010 : {err_code:20010, err_msg:"登录失败，账号已禁用"},
E20011 : {err_code:20011, err_msg:"用户不存在"},
E20012 : {err_code:20012, err_msg:"验证码发送失败"},
E20098 : {err_code:20098, err_msg:"数据参数不合法"},
E20099 : {err_code:20099, err_msg:"不合法的access_token"}
```
### SYSCODE
```
SysCode = {
  'P2P'  //P2P系统
  'FINANCE' //投顾系统
}
```
### SOURCE
```
Source = {
  'WEB'
  'WEB_APP'
  'APP'
  'BACK'
}
```