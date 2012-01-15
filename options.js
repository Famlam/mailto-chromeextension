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
    window.document.removeEventListener("change", handleSafariLocalStorageBug);
    handleSafariLocalStorageBug.handled = true;
  };
  handleSafariLocalStorageBug.handled = false;
  window.document.addEventListener("change", handleSafariLocalStorageBug);
}



// Set the option if it was already set before
var initializeCustom = function() {
  var custom = window.localStorage.getItem("custom");
  if (custom) {
    window.document.getElementById("custom").style.display = "inline-block";
    window.document.getElementById("customLabel").style.display = "inline";
    window.document.getElementById("customLabel").innerText = custom;
    window.document.getElementById("removeCustom").style.display = "inline";
    window.document.getElementById("addCustom").innerText = chrome.i18n.getMessage("change");
    window.document.getElementById("inputCustom").value = custom;
  } else {
    window.document.getElementById("custom").style.display = "none";
    window.document.getElementById("customLabel").style.display = "none";
    window.document.getElementById("removeCustom").style.display = "none";
    window.document.getElementById("addCustom").innerText = chrome.i18n.getMessage("customURL");
    window.document.getElementById("inputCustom").value = "";
  }
  window.document.getElementById("addCustom").style.display = "inline";
  window.document.getElementById("customURL").style.display = "none";
};
initializeCustom();
if (window.localStorage.getItem("mail")) {
  window.document.getElementById(window.localStorage.getItem("mail")).checked = true;
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
  if (items[i].type === "radio") {
    items[i].addEventListener("change", setSetting);
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
window.document.getElementById("inputCustom").addEventListener("input", validateCustomURL);

// Save a custom URL
var addCustomURL = function() {
  setSetting({target: {name: "mail", id: "custom"}});
  window.document.getElementById("custom").checked = true;
  window.localStorage.setItem("custom", window.document.getElementById("inputCustom").value);
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
});
window.document.getElementById("submitCustom").addEventListener("click", addCustomURL);

// Add, change or remove a custom URL
window.document.getElementById("addCustom").addEventListener("click", function() {
  window.document.getElementById("customURL").style.display = "block";
  this.style.display = "none";
  validateCustomURL();
  window.document.getElementById("inputCustom").focus();
});
window.document.getElementById("removeCustom").addEventListener("click", function() {
  window.localStorage.removeItem("custom");
  if (window.localStorage.getItem("mail") === "custom") {
    window.localStorage.removeItem("mail");
  }
  window.document.getElementById("mail").style.opacity = 1;
  if (!hideInterval) {
    hideInterval = window.setInterval(saveLabelFadeOut, 200);
  }
  if (typeof safari !== "undefined") {
    handleSafariLocalStorageBug();
  }
  initializeCustom();
});

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