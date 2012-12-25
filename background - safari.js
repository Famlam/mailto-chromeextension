"use strict";
// In case it is Safari, perform some code conversions.
var chrome = {
  extension: {
    getURL: function(path) { 
      return safari.extension.baseURI + path;
    },

    onMessage: {
      addListener: function(handler) {
        safari.application.addEventListener("message", function(e) {
          if (e.name !== "req") {
            return;
          }
          handler(e.message.data, undefined, function(dataToSend) {
            var responseMessage = { callbackToken: e.message.callbackToken, data: dataToSend };
            e.target.page.dispatchMessage("resp", responseMessage);
          });
        }, false);
      }
    }
  },
  
  contextMenus: {
    removeAll: function() {},
    onClicked: {
      removeListener: function() {}
    }
  },
  
  runtime: {
    onInstalled: {
      addListener: function(fn) {
        fn();
      }
    }
  }
};

// Background pages can't call window.open
window.open = function(url) {
  safari.application.activeBrowserWindow.openTab().url = url;
};


// Open the options page when requested via the settings page
safari.extension.settings.addEventListener("change", function(e) {
  if (e.key === 'openOptions' && e.newValue === true) {
    safari.extension.settings.openOptions = false;
    window.open(chrome.extension.getURL('options.html'));
  }
}, false);