"use strict";
chrome = {
  extension: {
    sendRequest: function(data, callback) {
      var callbackToken = "c" + Date.now(),
      responseHandler = function(e) {
        // Listen for a response for our specific request token.
        if (e.name !== "resp" || e.message.callbackToken !== callbackToken) {
          return;
        }
        callback(e.message.data);
        safari.self.removeEventListener("message", responseHandler, false);
      };

      safari.self.addEventListener("message", responseHandler, false);
      safari.self.tab.dispatchMessage("req", {
        data: data,
        callbackToken: callbackToken
      });
    }
  }
};