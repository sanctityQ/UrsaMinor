var tclog = require('../libs/tclog.js');
var _ = require('underscore');
var client_factory = require("../libs/client_factory");
var interact_types = client_factory.interact_types;
var ttypes = interact_types.ttypes;
var client = client_factory.interact_client;

module.exports = {

  triggerInteract : function(interactType, userId, inviteCode, extVal) {
    tclog.notice({userId:userId, interactType:interactType, inviteCode:inviteCode});
    var action = new ttypes.InteractAction({
      activeType:interactType,
      activeValue:extVal,
      inviterCode:inviteCode,
      userId:userId
    });
    client.interactActiveDeal(action, function(err, response) {
      if(err) {
        tclog.notice({msg:"triggerInteract error", userId:userId, interactType:interactType, error:err});
      } else {
        tclog.notice({msg:"triggerInteract success", userId:userId, interactType:interactType});
      }
    });
  }
};