var a = function(e) {
  var i;
  var mailtoLink = "";
  var target = e.target;
  if (e.type === "click") {
    while (!target.href && target.parentNode) {
      target = target.parentNode;
    }
    mailtoLink = target.href;
  } else if (target.action) {
    mailtoLink = target.action.replace(/\?.*$/,"");
    for (i=0; i<target.length; i++) {
      if (target[i].name && target[i].value) {
        mailtoLink += "&" + window.escape(target[i].name) + "=" + window.escape(target[i].value);
      }
    }
  }
  var regex = /^mailto\:(\/\/)?/i;
  if (!mailtoLink || !regex.test(mailtoLink)) {
    return;
  }

  chrome.extension.sendRequest("email", function(email) {
    var queryparts = {};
    var params = ("to=" + mailtoLink.replace(regex, '')).replace('?', '&').split('&');
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
        queryparts[what] = window.unescape(split[1]);
      }
    }

    var createPart = function(part, prefix, isAddress, useSemicolon) {
      var result = "";
      if (part && prefix !== undefined) {
        result = part;
        if (isAddress) {
          result = result.replace(/(^|\,)[^\,]*\<(.+?\@.+?\..+?)\>/g, "$1$2");
          if (useSemicolon) {
            result = result.replace(/\,/g, ';');
          }
        }
        result = prefix + window.escape(result);
      }
      return result;
    };
    var openLink = function(base, prefixCC, prefixBCC, prefixSubject, prefixBody, useSemicolonAndEscape) {
      var link = createPart(queryparts.to, "", true, useSemicolonAndEscape) +
        createPart(queryparts.cc, prefixCC, true, useSemicolonAndEscape) +
        createPart(queryparts.bcc, prefixBCC, true) +
        createPart(queryparts.subject, prefixSubject) +
        createPart(queryparts.body, prefixBody);
      if (useSemicolonAndEscape) {
        link = window.escape(link);
      }
      window.open(base + link);
    };

    switch (email) {
      case "wlm":
      case "hotmail":
        // to cc subject body
        openLink("http://mail.live.com/?rru=compose%3FTo%3D", "&CC=", undefined, "&subject=", "&body=", true);
        break;
      case "gmail":
        // to cc bcc subject body
        openLink("https://mail.google.com/mail/?view=cm&tf=1&to=", "&cc=", "&bcc=", "&su=", "&body=");
        break;
      case "ymail":
        // to cc bcc subject body
        openLink("http://compose.mail.yahoo.com/?To=", "&Cc=", "&Bcc=", "&Subj=", "&Body=");
        break;
      case "zoho":
        // to
        openLink("https://zmail.zoho.com/mail/compose.do?extsrc=mailto&mode=compose&tp=zb&ct=");
        break;
      case "fastmail":
        // to cc bcc subject body
        openLink("http://ssl.fastmail.fm/action/compose/?to=", "&cc=", "&bcc=", "&subject=", "&body=");
        break;
    }
  });
  e.preventDefault();
};
document.addEventListener("submit", a);
document.addEventListener("click", a);