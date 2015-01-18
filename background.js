"use strict";

var prepareAndOpenComposeURL = function(mailtoLink, serviceID, serviceURL, openerTab) {
  var queryparts = {};
  var i, split, what, newLine, val;
  var params = ("to=" + mailtoLink.replace('?', '&')).split('&');
  for (i = 0; i < params.length; i++) {
    split = params[i].match(/(\w+)\=(.*)/);
    if (!split) {
      continue;
    }
    what = split[1].toLowerCase();
    newLine = (what === "body" && serviceID !== "ymail" && serviceID !== "aol") ? "\r\n" : "";
    val = decodeURIComponent(split[2] || "").replace(/\r\n|\r|\n/g, newLine);
    if (queryparts[what]) {
      if (what === "to" || what === "bcc" || what === "cc") {
        if (val) {
          val = queryparts[what] + ", " + val;
        } else {
          val = queryparts[what];
        }
      } else if (what === "body") {
        val = queryparts[what] + newLine + val;
      }
    }
    if (split[2] !== undefined && split[2] !== null) {
      queryparts[what] = val;
    }
  }

  var prepareValue = function(part, isAddress) {
    var result = part || "";
    if (isAddress) {
      result = result.replace(/(^|\,)[^\,]*<(.+?\@.+?\..+?)\>/g, "$1$2");
      if (serviceID === "hotmail") {
        result = result.replace(/\,/g, ';');
      }
    }
    return encodeURIComponent(result);
  };
  if (serviceURL) {
    serviceURL = serviceURL.replace(/\{to\}/g, prepareValue(queryparts.to, true)).
             replace(/\{cc\}/g, prepareValue(queryparts.cc, true)).
             replace(/\{bcc\}/g, prepareValue(queryparts.bcc, true)).
             replace(/\{subject\}/g, prepareValue(queryparts.subject)).
             replace(/\{body\}/g, prepareValue(queryparts.body)).
             replace(/\{url\}/g, prepareValue('mailto:' + mailtoLink));
    chrome.tabs.create({url: serviceURL, windowId: openerTab.windowId, openerTabId: openerTab.id});
  } else {
    chrome.tabs.create({url: "mailto:" + mailtoLink, active: false}, function(newTab) {
      // chrome.tabs.onUpdated doesn't trigger for mailto: urls
      // poll using timeouts instead
      var tabExists = function() {
        chrome.tabs.get(newTab.id, function(tab) {
          if (tab.status === "complete") {
            chrome.tabs.remove(newTab.id);
          } else {
            window.setTimeout(tabExists, 25);
          }
        });
      };
      tabExists();
    });
  }
};

var getEmailService = function(input, openerTab) {
  chrome.storage.local.get(null, function(settings) {
    var serviceURL, serviceID;
    if (settings.currentService && settings.currentService.url) {
      serviceURL = settings.currentService.url;
      serviceID = settings.currentService.id;
    }
    if (!serviceURL) {
      var wnd = window.open(chrome.extension.getURL('options.html'), "_blank",
              'scrollbars=0,location=0,resizable=0,width=450,height=' + (144 + 21*Object.keys(settings.mailtoURLs).length));
      var onRemoved = function(tabId) {
        if (tabId === openerTab.id) {
          wnd.close();
        }
      };
      chrome.tabs.onRemoved.addListener(onRemoved);
      // keep the connection with the BGpage open until wnd closes
      wnd.chrome.runtime.onConnect.addListener(function() {});
      chrome.runtime.connect();
      // setTimeout doesn't work
      wnd.chrome.alarms.create("timeToClose", {delayInMinutes: 1});
      wnd.chrome.alarms.onAlarm.addListener(function(alarm) {
        if (alarm.name === "timeToClose") {
          wnd.close();
        }
      });

      wnd.addEventListener("beforeunload", function() {
        chrome.tabs.onRemoved.removeListener(onRemoved);
      });
      wnd.addEventListener("load", function() {
        var $ = wnd.$;
        $("<link>")
          .attr("rel", "stylesheet")
          .attr("type", "text/css")
          .attr("href", "askforclient.css")
          .appendTo($("head"));
        $("h1").text("Mailto:");
        $("title").text(wnd.chrome.i18n.getMessage('popupTitle'));
        wnd.preventSetService = true;
        $("#servicesList").on("change", "input", function(e) {
          serviceID = e.target.id.substring(8);
          if (serviceID !== "sysDefault") {
            prepareAndOpenComposeURL(input, serviceID, settings.mailtoURLs[serviceID].url, openerTab);
          } else {
            prepareAndOpenComposeURL(input, null, null, openerTab);
          }
          wnd.close();
        });
      });
    } else {
      prepareAndOpenComposeURL(input, serviceID, serviceURL, openerTab);
    }
  });
};

// Handle a click on a mailto: link
var onRequestHandler = function(msg, sender) {
  if (msg.action === "openMailto") {
    getEmailService(msg.data, sender.tab);
  }
};
chrome.runtime.onMessage.addListener(onRequestHandler);

var patternToRegex = function(pattern) {
  return pattern.replace(/\W/g, "\\$&").replace(/\\\*/, ".*");
};

// Install the context menus, if enabled in settings
chrome.storage.onChanged.addListener(function(changes) {
  if (changes.hasOwnProperty("contextmenu")) {
    if (changes.contextmenu.newValue === true) {
      chrome.contextMenus.create({id: "maillinkofthispage",
                                title: chrome.i18n.getMessage('mailThisPageURL')});
    } else {
      chrome.contextMenus.removeAll();
    }
  }
  
  var i, regexes = [];
  if (changes.hasOwnProperty("disableURLPatterns")) {
    for (i=0; i<changes.disableURLPatterns.newValue.length; i++) {
      regexes.push(patternToRegex(changes.disableURLPatterns.newValue[i]));
    }
    chrome.storage.local.set({"disableURLRegexes": regexes});
  }
});
chrome.contextMenus.onClicked.addListener(function(info, tab) {
  if (info.menuItemId === "maillinkofthispage") {
    var mailtoLink = '?subject=' + encodeURIComponent(tab.title) + '&body=' + encodeURIComponent(tab.url + '\n');
    getEmailService(mailtoLink, tab);
  }
});

// On installation, show the settings popup
chrome.runtime.onInstalled.addListener(function() {
  chrome.storage.local.get(null, function(obj) {
    if (obj.contextmenu) {
      chrome.contextMenus.removeAll();
      chrome.contextMenus.create({id: "maillinkofthispage",
                                title: chrome.i18n.getMessage('mailThisPageURL')});
    }
    
    // TEMP since 17-9-14
    if (localStorage.mailtoURLs) {
      obj.mailtoURLs = JSON.parse(localStorage.mailtoURLs);
    }
    if (localStorage.askAlways === "alwaysask") {
      obj.currentService = {
        id: "askEveryTime",
        name: chrome.i18n.getMessage("askEveryTime"),
        url: ""
      };
    } else if (localStorage.selectedMail && obj.mailtoURLs.hasOwnProperty(localStorage.selectedMail)) {
      obj.currentService = {
        id: localStorage.selectedMail,
        name: obj.mailtoURLs[localStorage.selectedMail].name || "",
        url: obj.mailtoURLs[localStorage.selectedMail].url
      };
    }
    if (localStorage.sendLinkPage === "sendLinkOfPage") {
      var contextMenuSupported = function(url) {
        return !url || /\{(url|body|subject)\}/.test(url);
      };
      if (obj.currentService && contextMenuSupported(obj.currentService.url)) {
        obj.contextmenu = true;
      }
    }
    // END TEMP since 17-9-14
    
    if (!obj.mailtoURLs) {
      obj.mailtoURLs = {
        aol: {name: "AOL mail", url: "http://mail.aol.com/33490-311/aim-6/en-us/mail/compose-message.aspx?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}"},
        fastmail: {name: "FastMail", url: "https://www.fastmail.fm/action/compose/?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}"},
        gmail: {name: "Gmail", url: "https://mail.google.com/mail/?view=cm&tf=1&to={to}&cc={cc}&bcc={bcc}&su={subject}&body={body}"},
        hotmail: {name: "Hotmail / Windows Live Mail / Outlook.com", url: "https://mail.live.com/default.aspx?rru=compose&to={to}&subject={subject}&body={body}&cc={cc}"},
        ymail: {name: "Yahoo mail", url: "http://compose.mail.yahoo.com/?To={to}&Cc={cc}&Bcc={bcc}&Subj={subject}&Body={body}"},
        zoho: {name: "Zoho mail", url: "https://zmail.zoho.com/mail/compose.do?extsrc=mailto&mode=compose&tp=zb&ct={to}"}
      };
    }
    
    chrome.storage.local.set(obj, function() {
      if (!obj.currentService) {
        chrome.windows.create({url: chrome.extension.getURL('options.html'), width: 640, height: 480, type: "popup"});
      }
      // TEMP since 17-9-14
      localStorage.clear();
      // END TEMP since 17-9-14
    });

  });
});

