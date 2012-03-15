// In case it is Safari, perform some code conversions.
if (typeof safari !== "undefined") {
  chrome = {
    extension: {
      getURL: function(path) { 
        return safari.extension.baseURI + path;
      },

      onRequest: {
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
      removeAll: function() {}
    }
  };
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
}

// Handle a click on a mailto: link
var onRequestHandler = function(mailtoLink, sender, sendResponse) {
  var mailtoAddresses = {
    aol: "http://mail.aol.com/33490-311/aim-6/en-us/mail/compose-message.aspx?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}",
    fastmail: "http://ssl.fastmail.fm/action/compose/?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}",
    gmail: "https://mail.google.com/mail/?view=cm&tf=1&to={to}&cc={cc}&bcc={bcc}&su={subject}&body={body}",
    hotmail: "http://mail.live.com/?rru=compose?To={to}&CC={cc}&subject={subject}&body={body}",
    ymail: "http://compose.mail.yahoo.com/?To={to}&Cc={cc}&Bcc={bcc}&Subj={subject}&Body={body}",
    zoho: "https://zmail.zoho.com/mail/compose.do?extsrc=mailto&mode=compose&tp=zb&ct={to}",
    custom: localStorage.getItem("custom")
  };

  var email = localStorage.getItem("mail");
  var link = mailtoAddresses[email];
  if (!link && typeof safari !== "undefined") {
    email = 'gmail';
    link = mailtoAddresses.gmail;
  }
  
  if (localStorage.getItem('askAlways') || !link) {
    var wnd = window.open(chrome.extension.getURL('options.html'), "_blank",
              'scrollbars=0,location=0,resizable=0,width=450,height=226');
    wnd.mailtoLink = mailtoLink;
    wnd.sR = sendResponse;
    wnd.addEventListener('load', function() {
      var stylesheet = wnd.document.createElement('link');
      stylesheet.setAttribute('rel', 'stylesheet');
      stylesheet.setAttribute('type', 'text/css');
      stylesheet.setAttribute('href', 'askforclient.css');
      wnd.document.head.appendChild(stylesheet);
      wnd.document.getElementById('h1title').innerText = 'Mailto:';
      wnd.document.title = wnd.chrome.i18n.getMessage('emailservice');
      var i, radiobuttons = wnd.document.getElementsByName("mail");
      var currentMail = localStorage.getItem('mail');
      var currentAsk = localStorage.getItem('askAlways');
      var onChangeHandler = function() {
        localStorage.removeItem('askAlways');
        onRequestHandler(wnd.mailtoLink, sender, wnd.sR);
        if (currentAsk) {
          localStorage.setItem('askAlways', 'alwaysask');
        }
        if (currentMail) {
          localStorage.setItem('mail', currentMail);
        } else {
          localStorage.removeItem('mail');
        }
        wnd.close();
      };
      for (i=0; i<radiobuttons.length; i++) {
        radiobuttons[i].checked = false;
        radiobuttons[i].addEventListener('change', onChangeHandler, false); 
      }
      wnd.setTimeout(function() {
        wnd.sR();
        wnd.close();
      }, 60000);
    }, false);
    return;
  }

  var queryparts = {};
  var i;
  var params = ("to=" + mailtoLink.replace('?', '&')).split('&');
  for (i = 0; i < params.length; i++) {
    var split = params[i].match(/(\w+)\=(.*)/);
    if (!split) {
      continue;
    }
    var what = split[1].toLowerCase();
    var newLine = (what === "body" && email !== "ymail" && email !== "aol") ? "\r\n" : "";
    var val = decodeURIComponent(split[2] || "").replace(/\r\n|\r|\n/g, newLine);
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
      if (email === "hotmail") {
        result = result.replace(/\,/g, ';');
      }
    }
    return encodeURIComponent(result);
  };

  // Let the content script call window.open so it'll stay in incognito or non-incognito
  sendResponse(
    link.replace(/\{to\}/g, prepareValue(queryparts.to, true)).
      replace(/\{cc\}/g, prepareValue(queryparts.cc, true)).
      replace(/\{bcc\}/g, prepareValue(queryparts.bcc, true)).
      replace(/\{subject\}/g, prepareValue(queryparts.subject)).
      replace(/\{body\}/g, prepareValue(queryparts.body)).
      replace(/\{url\}/g, prepareValue('mailto:' + mailtoLink))
  );
};
chrome.extension.onRequest.addListener(onRequestHandler);

var setContextMenu = function() {
  if (localStorage.getItem('sendLinkPage')) {
    chrome.contextMenus.create({title: chrome.i18n.getMessage('maillinkofthispage'),
        onclick: function(info, tab) {
          onRequestHandler('?subject=' + encodeURIComponent(tab.title) + '&body=' + encodeURIComponent(tab.url + '\n'), {tab: tab}, function(link) {
            chrome.tabs.create({url: link});
          });
        }
    });
  } else {
    chrome.contextMenus.removeAll();
  }
};
setContextMenu();


// On launch, check if an email provider was set
if (!localStorage.getItem("mail") && !localStorage.getItem("askAlways")) {
  window.open(chrome.extension.getURL('options.html'), "_blank",
              'scrollbars=0,location=0,resizable=0,width=450,height=226');
}
if (localStorage.getItem("custom") && !localStorage.getItem("customURLs")) {
  localStorage.setItem("customURLs", JSON.stringify([localStorage.getItem("custom")])); //TEMP since 16-1-12
}