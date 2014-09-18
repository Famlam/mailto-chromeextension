"use strict";
var a = function(e) {
  var i,
      mailtoLink = "",
      target = e.target,
      regex = /^mailto\:(\/\/)?/i;
  if (e.type === "click") {
    while (!target.href && target.parentNode) {
      target = target.parentNode;
    }
    mailtoLink = target.href;
  } else if (target.action) {
    mailtoLink = target.action;
    if (target.method !== "post") { 
      mailtoLink = mailtoLink.replace(/\?.*$/,"");
    }
    for (i=0; i<target.length; i++) {
      var targ = target[i];
      if (targ.name && targ.value && !targ.disabled && !((targ.type==="checkbox" || targ.type==="radio") && !targ.checked)) {
        if (targ.type !== "password" && ["to", "cc", "bcc", "subject", "body"].indexOf(targ.name.toLowerCase()) !== -1) {
          mailtoLink += "&" + encodeURIComponent(targ.name) + "=" + encodeURIComponent(targ.value);
        }
      }
    }
  }
  if (!mailtoLink || !regex.test(mailtoLink)) {
    return;
  }
  mailtoLink = mailtoLink.replace(regex, '');
  chrome.runtime.sendMessage({action: "openMailto", data: mailtoLink});
  e.preventDefault();
};

chrome.storage.local.get({"disableURLRegexes": []}, function(obj) {
  var i, regexes = obj.disableURLRegexes;
  for (i=0; i<regexes.length; i++) {
    if (new RegExp(regexes[i], "i").test(location.href)) {
      return;
    }
  }
  document.addEventListener("submit", a, false);
  document.addEventListener("click", a, false);
});
