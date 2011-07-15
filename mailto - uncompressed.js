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
  mailtoLink = mailtoLink.replace(regex, '');
  chrome.extension.sendRequest(mailtoLink, function(link) {
    if (link) {
      window.open(link);
    }
  });
  e.preventDefault();
};
document.addEventListener("submit", a);
document.addEventListener("click", a);