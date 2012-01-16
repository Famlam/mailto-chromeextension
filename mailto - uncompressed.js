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
    mailtoLink = target.action;
    if (target.method !== "post") { 
      mailtoLink = mailtoLink.replace(/\?.*$/,"");
    }
    for (i=0; i<target.length; i++) {
      var targ = target[i];
      if (targ.name && targ.value && !targ.disabled && !((targ.type==="checkbox" || targ.type==="radio") && !targ.checked)) {
        mailtoLink += "&" + window.encodeURIComponent(targ.name) + "=" + window.encodeURIComponent(targ.value);
      }
    }
  }
  var regex = /^mailto\:(\/\/)?/i;
  if (!mailtoLink || !regex.test(mailtoLink)) {
    return;
  }
  mailtoLink = mailtoLink.replace(regex, '');
  chrome.extension.sendRequest(mailtoLink, function(link) {
    if (link) {
      window.open(link);
    }
  });
  e.preventDefault();
};
window.document.addEventListener("submit", a, false);
window.document.addEventListener("click", a, false);