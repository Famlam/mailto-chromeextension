if (typeof safari !== "undefined") {
  chrome = {
    i18n: {
      getMessage: function(messageID, args) {
        var i;
        if (typeof chrome.i18n.strings === "undefined") {
          var languages = [navigator.language.replace('-', '_')];
          if (navigator.language.length > 2) {
            languages.push(navigator.language.substring(0, 2));
          }
          if (navigator.language !== "en") {
            languages.push("en");
          }
          chrome.i18n.strings = {};

          // Get the translation required and prepare it for being used.
          var fetchAndParse = function(locale) {
            var xhr = new XMLHttpRequest();
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
    var warning = document.createElement("p");
    warning.innerText = chrome.i18n.getMessage("restartBrowser");
    warning.setAttribute("style", "font-weight: bold; color: red");
    document.body.appendChild(warning);
    document.removeEventListener("change", handleSafariLocalStorageBug, false);
    handleSafariLocalStorageBug.handled = true;
  };
  handleSafariLocalStorageBug.handled = false;
  document.addEventListener("change", handleSafariLocalStorageBug, false);
  
  // Safari doesn't return the window object for the window.open alternative,
  // and window.open isn't accessible in the background page.
  document.getElementById('askMeEveryTime').style.display = 'none';
}

// ============================= END SAFARI CODE ============================= //


// ------ SHOWING AND EDITING THE LIST OF CUSTOM URLS ------
var removeCustomURL = function(thisURL) {
  thisURL = (typeof thisURL === "string" ? thisURL : this.previousElementSibling.previousElementSibling.innerText);
  var customURLs = JSON.parse(localStorage.getItem("customURLs"));
  var index = customURLs.indexOf(thisURL);
  customURLs.splice(index, 1);
  if (customURLs.length) {
    localStorage.setItem("customURLs", JSON.stringify(customURLs));
  } else {
    localStorage.removeItem('customURLs');
  }
  if (localStorage.getItem('custom') === thisURL) {
    localStorage.removeItem('custom');
    if (localStorage.getItem('mail') === 'custom') {
      localStorage.removeItem('mail');
    }
  }
  document.getElementById("mail").style.opacity = 1;
  if (!hideInterval) {
    hideInterval = setInterval(saveLabelFadeOut, 200);
  }
  if (typeof safari !== "undefined") {
    handleSafariLocalStorageBug();
  }
  initializeCustom();
};
var addNewCustomURL = function() {
  document.getElementById("customURL").style.display = "block";
  document.getElementById("addCustom").style.display = "none";
  validateCustomURL();
  document.getElementById("inputCustom").focus();
};
var changeCustomURL = function() {
  document.getElementById("inputCustom").value = this.previousElementSibling.innerText;
  removeCustomURL(this.previousElementSibling.innerText);
  addNewCustomURL();
};
var customURLSelected = function() {
  setSetting({target: {name: "mail", id: "custom"}});
  localStorage.setItem('custom', this.nextElementSibling.innerText);
};
var initializeCustom = function() {
  var customURLs = JSON.parse(localStorage.getItem("customURLs")) || [];
  var emailArea = document.getElementById('customemailclients'), i, selected;
  if (localStorage.getItem("mail") === 'custom') {
    selected = localStorage.getItem('custom');
  }
  while (emailArea.firstChild) {
    emailArea.removeChild(emailArea.firstChild);
  }
  for (i=0; i<customURLs.length; i++) {
    var input = document.createElement('input');
      input.setAttribute('name', 'mail');
      input.setAttribute('type', 'radio');
      input.setAttribute('id', 'custom' + i);
      input.addEventListener('change', customURLSelected, false);
    emailArea.appendChild(input);
    var label = document.createElement('label');
      label.setAttribute('for', 'custom' + i);
      label.innerText = customURLs[i];
    emailArea.appendChild(label);
    var change = document.createElement('a');
      change.setAttribute('href', '#customURL');
      change.innerText = chrome.i18n.getMessage('change');
      change.addEventListener('click', changeCustomURL, false);
    emailArea.appendChild(change);
    var remove = document.createElement('a');
      remove.setAttribute('href', '#');
      remove.innerText = chrome.i18n.getMessage('remove');
      remove.addEventListener('click', removeCustomURL, false);
    emailArea.appendChild(remove);
    emailArea.appendChild(document.createElement('br'));

    if (customURLs[i] === selected) {
      input.checked = true;
    }
  }
  var add = document.createElement('a');
    add.setAttribute('href', '#customURL');
    add.setAttribute('id', 'addCustom');
    add.innerText = chrome.i18n.getMessage('customURL');
    add.addEventListener('click', addNewCustomURL, false);
  emailArea.appendChild(add);
  document.getElementById("customURL").style.display = "none";
};
initializeCustom();


if (localStorage.getItem("mail")) {
  var elem = document.getElementById(localStorage.getItem("mail"));
  if (elem) {
    elem.checked = true;
  }
}

// ------ SAVING WHAT EMAIL CLIENT TO USE ------
var hideInterval = null, saveLabelFadeOut = function() {
  // Fade out. If there are no more labels to fade out -> delete interval
  var i, items = document.getElementsByClassName("saved"), fadingLabelsCount = 0;
  for (i=0; i<items.length; i++) {
    if (!items[i].style || !items[i].style.opacity || items[i].style.opacity < 0.05) {
      items[i].style.opacity = 0;
      if (!fadingLabelsCount && i === items.length - 1) {
        clearInterval(hideInterval);
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
  localStorage.setItem(e.target.name, e.target.id);
  document.getElementById(e.target.name).style.opacity = 1;
  if (!hideInterval) {
    hideInterval = setInterval(saveLabelFadeOut, 200);
  }
};

// Trigger when an input element changes
var i, items = document.getElementsByTagName("input");
for (i=0; i<items.length; i++) {
  if (items[i].type === "radio" && items[i].parentNode.id !== "customemailclients") {
    items[i].addEventListener("change", setSetting, false);
  }
}

// ------ CUSTOM URLS ------
// Validate the custom URL
var validateCustomURL = function() {
  if (/^https?\:\/\/([a-z0-9\-_\xE3-\xFF]+\.)+[a-z0-9]+\/.*\{(to|url)\}/.test(document.getElementById("inputCustom").value)) {
    document.getElementById("submitCustom").disabled = false;
  } else {
    document.getElementById("submitCustom").disabled = true;
  }
};
document.getElementById("inputCustom").addEventListener("input", validateCustomURL, false);

var addCustomURL = function() {
  setSetting({target: {name: "mail", id: "custom"}});
  var newURL = document.getElementById("inputCustom").value;
  document.getElementById("inputCustom").value = "";
  var customlist = JSON.parse(localStorage.getItem("customURLs")) || [];
  if (customlist.indexOf(newURL) === -1) {
    customlist.push(newURL);
    customlist.sort();
  }
  localStorage.setItem('customURLs', JSON.stringify(customlist));
  localStorage.setItem('custom', newURL);
  if (typeof safari !== "undefined") {
    handleSafariLocalStorageBug();
  }
  initializeCustom();
};

document.getElementById("inputCustom").addEventListener("keypress", function(e) {
  if (e.keyCode === 13 && !document.getElementById("submitCustom").disabled) {
    addCustomURL();
    e.preventDefault();
  }
}, false);
document.getElementById("submitCustom").addEventListener("click", addCustomURL, false);


// ------ THE ASK ME EVERY TIME OPTION ------
document.getElementById("alwaysask").addEventListener("change", function(e) {
  setSetting(e);
  if (!e.target.checked) {
    localStorage.removeItem('askAlways');
  }
}, false);
if (localStorage.getItem('askAlways')) {
  document.getElementById("alwaysask").checked = true;
}


// ------ FINISHING TOUCH ------
// Translate a page into the users language
items = document.querySelectorAll("[data-i18n]");
for (i=0; i<items.length; i++) {
  var translation = chrome.i18n.getMessage(items[i].getAttribute("data-i18n"));
  if (items[i].value === "i18n") {
    items[i].value = translation;
  } else {
    items[i].innerText = translation;
  }
}

document.getElementById('explainCustom').innerHTML = document.getElementById('explainCustom').innerText.replace("<a>", '<a href="#" id="explainLink">'); 
if (document.getElementById('explainLink')) {
  document.getElementById('explainLink').addEventListener("click", function() {
    window.open('http://code.google.com/p/mailto-chromeextension/wiki/AddCustomUrl');
  });
}