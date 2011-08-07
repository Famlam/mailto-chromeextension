chrome = {
  extension: {
    sendRequest: function(data, callback) {
      var callbackToken = "c" + window.Date.now();
      // Listen for a response for our specific request token.
      var responseHandler = function(e) {
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