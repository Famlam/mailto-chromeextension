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
        mailtoLink += "&" + encodeURIComponent(targ.name) + "=" + encodeURIComponent(targ.value);
      }
    }
  }
  if (!mailtoLink || !regex.test(mailtoLink)) {
    return;
  }
  mailtoLink = mailtoLink.replace(regex, '');
  chrome.extension.sendRequest(mailtoLink, function(link) {
    if (link === -1) {
      location.replace('mailto:' + mailtoLink);
    } else if (link) {
      window.open(link);
    }
  });
  e.preventDefault();
};
document.addEventListener("submit", a, false);
document.addEventListener("click", a, false);