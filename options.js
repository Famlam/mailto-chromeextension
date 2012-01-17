if (typeof safari !== "undefined") {
  chrome = {
    i18n: {
      getMessage: function(messageID, args) {
        var i;
        if (typeof chrome.i18n.strings === "undefined") {
          var languages = [window.navigator.language.replace('-', '_')];
          if (window.navigator.language.length > 2) {
            languages.push(window.navigator.language.substring(0, 2));
          }
          if (window.navigator.language !== "en") {
            languages.push("en");
          }
          chrome.i18n.strings = {};

          // Get the translation required and prepare it for being used.
          var fetchAndParse = function(locale) {
            var xhr = new window.XMLHttpRequest();
            xhr.open("GET", safari.extension.baseURI + "_locales/" + locale + "/messages.json", false);
            xhr.onreadystatechange = function() {
              if (this.readyState === 4 && this.responseText) {
                var parsed = JSON.parse(this.responseText);
                var string;
                for (string in parsed) {
                  if (!chrome.i18n.strings[string]) {
                    var result = parsed[string].message;
                    // Parse placeholders
                    var ph = parsed[string].placeholders;
                    if (ph) {
                      var phID;
                      for (phID in ph) {
                        var rgx = new RegExp("\\$" + phID + "\\$");
                        result = result.replace(rgx, ph[phID].content);
                      }
                    }
                    chrome.i18n.strings[string] = result;
                  }
                }
              }
            };
            try {
              xhr.send();
            } catch (ex) {}
          };
          for (i=0; i < languages.length; i++) {
            fetchAndParse(languages[i]);
          }
        }

        if (typeof args === "string") {
          args = [args];
        } else if (!args) {
          args = [];
        }
        var edited = chrome.i18n.strings[messageID].replace(/\$\$/g, "@@@@"); // $$ shouldn't get escaped
        for (i=0; i<args.length; i++) {
          var rgx = new RegExp("(?!\\$\\$)\\$" + (i+1), "g");
          edited = edited.replace(rgx, args[i]);
        }
        return edited.replace(/\@\@\@\@/g, "$$");
      }
    }
  };

  // The background page doesn't have direct access to localStorage changes
  // Therefore users must restart Safari first.
  var handleSafariLocalStorageBug = function() {
    if (handleSafariLocalStorageBug.handled) {
      return;
    }
    var warning = window.document.createElement("p");
    warning.innerText = chrome.i18n.getMessage("restartBrowser");
    warning.setAttribute("style", "font-weight: bold; color: red");
    window.document.body.appendChild(warning);
    window.document.removeEventListener("change", handleSafariLocalStorageBug, false);
    handleSafariLocalStorageBug.handled = true;
  };
  handleSafariLocalStorageBug.handled = false;
  window.document.addEventListener("change", handleSafariLocalStorageBug, false);
  
  // Safari doesn't return the window object for wnd = window.open().
  window.document.getElementById('askMeEveryTime').style.display = 'none';
}

// ============================= END SAFARI CODE ============================= //


// ------ SHOWING AND EDITING THE LIST OF CUSTOM URLS ------
var removeCustomURL = function(thisURL) {
  thisURL = (typeof thisURL === "string" ? thisURL : this.previousElementSibling.previousElementSibling.innerText);
  var customURLs = JSON.parse(window.localStorage.getItem("customURLs"));
  var index = customURLs.indexOf(thisURL);
  customURLs.splice(index, 1);
  if (customURLs.length) {
    window.localStorage.setItem("customURLs", JSON.stringify(customURLs));
  } else {
    window.localStorage.removeItem('customURLs');
  }
  if (window.localStorage.getItem('custom') === thisURL) {
    window.localStorage.removeItem('custom');
    if (window.localStorage.getItem('mail') === 'custom') {
      window.localStorage.removeItem('mail');
    }
  }
  window.document.getElementById("mail").style.opacity = 1;
  if (!hideInterval) {
    hideInterval = window.setInterval(saveLabelFadeOut, 200);
  }
  if (typeof safari !== "undefined") {
    handleSafariLocalStorageBug();
  }
  initializeCustom();
};
var addNewCustomURL = function() {
  window.document.getElementById("customURL").style.display = "block";
  window.document.getElementById("addCustom").style.display = "none";
  validateCustomURL();
  window.document.getElementById("inputCustom").focus();
};
var changeCustomURL = function() {
  window.document.getElementById("inputCustom").value = this.previousElementSibling.innerText;
  removeCustomURL(this.previousElementSibling.innerText);
  addNewCustomURL();
};
var customURLSelected = function() {
  setSetting({target: {name: "mail", id: "custom"}});
  window.localStorage.setItem('custom', this.nextElementSibling.innerText);
};
var initializeCustom = function() {
  var customURLs = JSON.parse(window.localStorage.getItem("customURLs")) || [];
  var emailArea = window.document.getElementById('customemailclients'), i, selected;
  if (window.localStorage.getItem("mail") === 'custom') {
    selected = window.localStorage.getItem('custom');
  }
  while (emailArea.firstChild) {
    emailArea.removeChild(emailArea.firstChild);
  }
  for (i=0; i<customURLs.length; i++) {
    var input = window.document.createElement('input');
      input.setAttribute('name', 'mail');
      input.setAttribute('type', 'radio');
      input.setAttribute('id', 'custom' + i);
      input.addEventListener('change', customURLSelected, false);
    emailArea.appendChild(input);
    var label = window.document.createElement('label');
      label.setAttribute('for', 'custom' + i);
      label.innerText = customURLs[i];
    emailArea.appendChild(label);
    var change = window.document.createElement('a');
      change.setAttribute('href', '#customURL');
      change.innerText = chrome.i18n.getMessage('change');
      change.addEventListener('click', changeCustomURL, false);
    emailArea.appendChild(change);
    var remove = window.document.createElement('a');
      remove.setAttribute('href', '#');
      remove.innerText = chrome.i18n.getMessage('remove');
      remove.addEventListener('click', removeCustomURL, false);
    emailArea.appendChild(remove);
    emailArea.appendChild(document.createElement('br'));

    if (customURLs[i] === selected) {
      input.checked = true;
    }
  }
  var add = window.document.createElement('a');
    add.setAttribute('href', '#customURL');
    add.setAttribute('id', 'addCustom');
    add.innerText = chrome.i18n.getMessage('customURL');
    add.addEventListener('click', addNewCustomURL, false);
  emailArea.appendChild(add);
  window.document.getElementById("customURL").style.display = "none";
};
initializeCustom();


if (window.localStorage.getItem("mail")) {
  var elem = window.document.getElementById(window.localStorage.getItem("mail"));
  if (elem) {
    elem.checked = true;
  }
}

// ------ SAVING WHAT EMAIL CLIENT TO USE ------
var hideInterval = null, saveLabelFadeOut = function() {
  // Fade out. If there are no more labels to fade out -> delete interval
  var i, items = window.document.getElementsByClassName("saved"), fadingLabelsCount = 0;
  for (i=0; i<items.length; i++) {
    if (!items[i].style || !items[i].style.opacity || items[i].style.opacity < 0.05) {
      items[i].style.opacity = 0;
      if (!fadingLabelsCount && i === items.length - 1) {
        window.clearInterval(hideInterval);
        hideInterval = null;
      }
    } else {
      items[i].style.opacity = items[i].style.opacity - 0.03;
      fadingLabelsCount++;
    }
  }
};
var setSetting = function(e) {
  // Save and show the correct 'saved' message
  window.localStorage.setItem(e.target.name, e.target.id);
  window.document.getElementById(e.target.name).style.opacity = 1;
  if (!hideInterval) {
    hideInterval = window.setInterval(saveLabelFadeOut, 200);
  }
};

// Trigger when an input element changes
var i, items = window.document.getElementsByTagName("input");
for (i=0; i<items.length; i++) {
  if (items[i].type === "radio" && items[i].parentNode.id !== "customemailclients") {
    items[i].addEventListener("change", setSetting, false);
  }
}

// ------ CUSTOM URLS ------
// Validate the custom URL
var validateCustomURL = function() {
  if (/^https?\:\/\/([a-z0-9\-_\xE3-\xFF]+\.)+[a-z0-9]+\/.*\{to\}/.test(window.document.getElementById("inputCustom").value)) {
    window.document.getElementById("submitCustom").disabled = false;
  } else {
    window.document.getElementById("submitCustom").disabled = true;
  }
};
window.document.getElementById("inputCustom").addEventListener("input", validateCustomURL, false);

var addCustomURL = function() {
  setSetting({target: {name: "mail", id: "custom"}});
  var newURL = window.document.getElementById("inputCustom").value;
  window.document.getElementById("inputCustom").value = "";
  var customlist = JSON.parse(window.localStorage.getItem("customURLs")) || [];
  if (customlist.indexOf(newURL) === -1) {
    customlist.push(newURL);
    customlist.sort();
  }
  window.localStorage.setItem('customURLs', JSON.stringify(customlist));
  window.localStorage.setItem('custom', newURL);
  if (typeof safari !== "undefined") {
    handleSafariLocalStorageBug();
  }
  initializeCustom();
};

window.document.getElementById("inputCustom").addEventListener("keypress", function(e) {
  if (e.keyCode === 13 && !window.document.getElementById("submitCustom").disabled) {
    addCustomURL();
    e.preventDefault();
  }
}, false);
window.document.getElementById("submitCustom").addEventListener("click", addCustomURL, false);


// ------ THE ASK ME EVERY TIME OPTION ------
window.document.getElementById("alwaysask").addEventListener("change", function(e) {
  setSetting(e);
  if (!e.target.checked) {
    window.localStorage.removeItem('askAlways');
  }
}, false);
if (window.localStorage.getItem('askAlways')) {
  window.document.getElementById("alwaysask").checked = true;
}


// ------ FINISHING TOUCH ------
// Translate a page into the users language
items = window.document.querySelectorAll("[data-i18n]");
for (i=0; i<items.length; i++) {
  var translation = chrome.i18n.getMessage(items[i].getAttribute("data-i18n"));
  if (items[i].value === "i18n") {
    items[i].value = translation;
  } else {
    items[i].innerText = translation;
  }
}

window.document.getElementById('explainCustom').innerHTML = window.document.getElementById('explainCustom').innerText.replace(/(\{\w+\})/g, '<b><i>$1</i></b>'); 