"use strict";
// Handle a click on a mailto: link
var onRequestHandler = function(mailtoLink, sender, sendResponse) {
  var email = localStorage.getItem("selectedMail");
  var mailtoAddresses = JSON.parse(localStorage.getItem("mailtoURLs")) || {};
  var link = (mailtoAddresses[email] || {}).url;

  if (!link && typeof safari !== "undefined") {
    // can't show popup in Safari. Default to Gmail...
    email = 'gmail';
    link = (mailtoAddresses.gmail || {}).url;
    if (!link) {
      link = "https://mail.google.com/mail/?view=cm&tf=1&to={to}&cc={cc}&bcc={bcc}&su={subject}&body={body}";
    }
  }
  
  if (localStorage.getItem('askAlways') || !link) {
    var wnd = window.open(chrome.extension.getURL('options.html'), "_blank",
              'scrollbars=0,location=0,resizable=0,width=450,height=' + (128 + 19*Object.keys(mailtoAddresses).length));
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
      var i, radiobuttons = wnd.document.getElementsByName("selectedMail");
      var currentMail = localStorage.getItem('selectedMail');
      var currentAsk = localStorage.getItem('askAlways');
      var onChangeHandler = function(e) {
        localStorage.removeItem('askAlways');
        if (e.target.id !== "systemdefault") {
          onRequestHandler(wnd.mailtoLink, sender, wnd.sR);
        } else {
          wnd.sR(-1);
        }
        if (currentAsk) {
          localStorage.setItem('askAlways', 'alwaysask');
        }
        if (currentMail) {
          localStorage.setItem('selectedMail', currentMail);
        } else {
          localStorage.removeItem('selectedMail');
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
    return true;
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

  link = link.replace(/\{to\}/g, prepareValue(queryparts.to, true)).
           replace(/\{cc\}/g, prepareValue(queryparts.cc, true)).
           replace(/\{bcc\}/g, prepareValue(queryparts.bcc, true)).
           replace(/\{subject\}/g, prepareValue(queryparts.subject)).
           replace(/\{body\}/g, prepareValue(queryparts.body)).
           replace(/\{url\}/g, prepareValue('mailto:' + mailtoLink));
  // Let the content script call window.open so it'll stay in incognito or non-incognito
  // Fails in Safari and Opera, since the popup blocker blocks those popups
  if (typeof safari === "undefined" && typeof opr === "undefined") {
    sendResponse(link);
  } else {
    sendResponse();
    chrome.tabs.create({url: link});
  }
};
chrome.extension.onMessage.addListener(onRequestHandler);


// Install the context menus, if enabled in settings
var setContextMenu = function() {
  chrome.contextMenus.removeAll();
  chrome.contextMenus.onClicked.removeListener(contextMenuHandler);
  if (localStorage.getItem('sendLinkPage')) {
    chrome.contextMenus.create({id: "maillinkofthispage",
                                title: chrome.i18n.getMessage('maillinkofthispage')});
    chrome.contextMenus.onClicked.addListener(contextMenuHandler);
  }
};
var contextMenuHandler = function(info, tab) {
  if (info.menuItemId === "maillinkofthispage") {
    var mailtoLink = '?subject=' + encodeURIComponent(tab.title) + '&body=' + encodeURIComponent(tab.url + '\n');
    onRequestHandler(mailtoLink, {tab: tab}, function(link) {
      if (link === -1) {
        chrome.tabs.create({url: 'mailto:' + mailtoLink}, function(tab) {
          window.setTimeout(function() {
            chrome.tabs.remove(tab.id);
          }, 600);
        });
      } else if (link) {
        chrome.tabs.create({url: link});
      }
    });
  }
};

// On installation, show the settings popup
chrome.runtime.onInstalled.addListener(function() {
  if (!localStorage.getItem("selectedMail") && !localStorage.getItem("askAlways")) {
    if (!localStorage.getItem("mail")) { // TEMP since 24-7-13: removed 'mail' from localStorage
      window.open(chrome.extension.getURL('options.html'), "_blank",
                  'scrollbars=0,location=0,resizable=0,width=450,height=226');
    }
  }

  if (localStorage.getItem("custom") && !localStorage.getItem("customURLs")) {
    localStorage.setItem("customURLs", JSON.stringify([localStorage.getItem("custom")])); //TEMP since 16-1-12
  }
  
  if (!localStorage.getItem("mailtoURLs")) { // TEMP since 24-7-13
    var mailtoAddresses = {
      aol: {name: "AOL mail", url: "http://mail.aol.com/33490-311/aim-6/en-us/mail/compose-message.aspx?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}"},
      fastmail: {name: "FastMail", url: "https://www.fastmail.fm/action/compose/?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}"},
      gmail: {name: "Gmail", url: "https://mail.google.com/mail/?view=cm&tf=1&to={to}&cc={cc}&bcc={bcc}&su={subject}&body={body}"},
      hotmail: {name: "Hotmail / Windows Live Mail / Outlook.com", url: "https://mail.live.com/default.aspx?rru=compose&to={to}&subject={subject}&body={body}&cc={cc}"},
      myopera: {name: "My Opera mail", url: "https://mail.opera.com/action/compose/?to={to}&cc={cc}&bcc={bcc}&subject={subject}&body={body}"},
      ymail: {name: "Yahoo mail", url: "http://compose.mail.yahoo.com/?To={to}&Cc={cc}&Bcc={bcc}&Subj={subject}&Body={body}"},
      zoho: {name: "Zoho mail", url: "https://zmail.zoho.com/mail/compose.do?extsrc=mailto&mode=compose&tp=zb&ct={to}"}
    };
    localStorage.setItem("selectedMail", localStorage.getItem("mail"));
    var i, old = localStorage.getItem("customURLs");
    if (old) {
      old = JSON.parse(old);
      for (i=0; i<old.length; i++) {
        mailtoAddresses["custom" + i] = {url: old[i]};
        if (localStorage.getItem("mail") === "custom" && localStorage.getItem("custom") === old[i]) {
          localStorage.setItem("selectedMail", "custom" + i);
        }
      }
    }
    localStorage.setItem("mailtoURLs", JSON.stringify(mailtoAddresses));
    localStorage.removeItem("mail");
    localStorage.removeItem("custom");
    localStorage.removeItem("customURLs");
  }
});

setContextMenu();