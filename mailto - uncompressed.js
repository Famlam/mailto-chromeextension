window.addEventListener("load", function() {
  var i;
  var mailtoLinks = [];
  var allHref = document.querySelectorAll("[href], form[action]");
  for (i=0; i<allHref.length; i++) {
    if (/^mailto\:.+/i.test(allHref[i].href || allHref[i].action + "?")) {
      mailtoLinks.push(allHref[i]);
    }
  }
  window.removeEventListener("load", arguments.callee);

  if (mailtoLinks.length) {
    var openMailtoLink = function(e) {
      chrome.extension.sendRequest("email", function(email) {
        var createPart = function(part, prefix, isAddress, useSemicolon) {
          if (!part) {
            return "";
          }
          if (isAddress) {
            part = part.replace(/(^|\,)[^\,]*\<(.+?\@.+?\..+?)\>/g, "$1$2");
          }
          if (useSemicolon) {
            part = part.replace(/\,/g, ';');
          }
          return (prefix || "") + window.escape(part);
        };

        var i;
        var suggestedLink = "";
        if (e.target.nodeName === "FORM") {
          for (i=0; i<e.target.length; i++) {
            var me = e.target[i];
            if (me.name && me.value) {
              suggestedLink += "&" + window.escape(me.name) + "=" + window.escape(me.value);
            }
          }
          suggestedLink = suggestedLink.replace(/^\&/, "mailto:?");
        } else {
          var target = e.target;
          while (!target.href && target.parentNode) {
            target = target.parentNode;
          }
          suggestedLink = target.href;
        }
        var match = (suggestedLink || "").match(/^mailto\:(.+)$/i);
        if (!match) {
          return;
        }

        var queryparts = {};
        var params = ("to=" + match[1]).replace(/\?/,'&').split('&');
        for (i = 0; i < params.length; i++) {
          var split = params[i].split('=');
          var what = split[0].toLowerCase();
          if (queryparts[what]) {
            if (split[1] && (what === "to" || what === "bcc" || what === "cc")) {
              split[1] = queryparts[what] + ", " + split[1];
            } else if (what === "body") {
              split[1] = queryparts[what] + "%0D%0A" + split[1];
            }
          }
          if (split[1]) {
            queryparts[what] = window.unescape(split[1] || "");
          }
        }

        var link = "";
        switch (email) {
          case "wlm":
          case "hotmail":
            // to cc subject body
            var hotmaillink = "compose?To=" +
              createPart(queryparts.to, "", true, true) +
              createPart(queryparts.cc, "&CC=", true, true) +
              createPart(queryparts.subject, "&subject=") +
              createPart(queryparts.body, "&body=");
            link = "http://mail.live.com/?rru=" + window.escape(hotmaillink);
            break;
          case "gmail":
            // to cc bcc subject body
            var gmaillink = createPart(queryparts.to, "", true) +
              createPart(queryparts.cc, "&cc=", true) +
              createPart(queryparts.bcc, "&bcc=", true) +
              createPart(queryparts.subject, "&su=") +
              createPart(queryparts.body, "&body=");
            link = "https://mail.google.com/mail/?view=cm&tf=1&to=" + gmaillink;
            break;
          case "ymail":
            // to cc bcc subject body
            var ymaillink = createPart(queryparts.to, "", true) +
              createPart(queryparts.cc, "&Cc=", true) +
              createPart(queryparts.bcc, "&Bcc=", true) +
              createPart(queryparts.subject, "&Subject=") +
              createPart(queryparts.body, "&Body=");
            link = "http://compose.mail.yahoo.com/?To=" + ymaillink;
            break;
          case "zoho":
            // to
            var zoholink = createPart(queryparts.to, "", true);
            link = "https://zmail.zoho.com/mail/compose.do?extsrc=mailto&mode=compose&tp=zb&ct=" + zoholink;
            break;
          case "fastmail":
            // to cc bcc subject body
            var fastmaillink = createPart(queryparts.to, "", true) +
              createPart(queryparts.cc, "&cc=", true) +
              createPart(queryparts.bcc, "&bcc=", true) +
              createPart(queryparts.subject, "&subject=") +
              createPart(queryparts.body, "&body=");
            link = "http://ssl.fastmail.fm/action/compose/?to=" + fastmaillink;
            break;
        }

        window.open(link);
      });
      e.preventDefault();
    };

    for (i = 0; i < mailtoLinks.length; i++) {
      mailtoLinks[i].addEventListener(mailtoLinks[i].nodeName === "FORM" ? "submit" : "click", openMailtoLink);
    }
  }
});