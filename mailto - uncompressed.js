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
      if (target[i].name && target[i].value && !target[i].disabled && !((target[i].type==="checkbox" || target[i].type==="radio") && !target[i].checked)) {
        mailtoLink += "&" + window.encodeURIComponent(target[i].name) + "=" + window.encodeURIComponent(target[i].value);
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
window.document.addEventListener("submit", a);
window.document.addEventListener("click", a);