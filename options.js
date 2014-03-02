"use strict";

var createText = function(text, appendTo) {
  var el = document.createTextNode(text);
  if (appendTo) {
    appendTo.appendChild(el);
  }
  return el;
};
var createTag = function(tagname, attributes, properties, appendTo) {
  var i, el = document.createElement(tagname);
  if (attributes) {
    for (i in attributes) {
      el.setAttribute(i, attributes[i]);
    }
  }
  if (properties) {
    for (i in properties) {
      if (i === "textContent") {
        createText(properties[i], el);
      } else {
        el[i] = properties[i];
      }
    }
  }
  if (appendTo) {
    appendTo.appendChild(el);
  }
  return el;
};

// Trigger when an input element changes
var i, items = document.getElementsByTagName("input");
for (i=0; i<items.length; i++) {
  if (items[i].type === "radio") {
    items[i].addEventListener("change", setSetting, false);
  }
}

// ------ SHOWING AND EDITING THE LIST OF CUSTOM URLS ------
var removeCustomURL = function(id) {
  id = (typeof id === "string") ? id : this.dataset.id;
  var URLs = JSON.parse(localStorage.getItem("mailtoURLs"));
  delete URLs[id];
  localStorage.setItem("mailtoURLs", JSON.stringify(URLs));
  
  if (localStorage.getItem("selectedMail") === id) {
    localStorage.removeItem("selectedMail");
  }
  initializeCustom();
  document.getElementById("selectedMail").style.opacity = 1;
  if (!hideInterval) {
    hideInterval = setInterval(saveLabelFadeOut, 200);
  }
};
var addNewCustomURL = function() {
  document.getElementById("customURL").style.display = "block";
  document.getElementById("addCustom").style.display = "none";
  validateCustomURL();
  document.getElementById("inputCustom").focus();
};
var changeCustomURL = function() {
  var id = this.dataset.id;
  var URLs = JSON.parse(localStorage.getItem("mailtoURLs"));
  document.getElementById("inputCustom").value = URLs[id].url;
  document.getElementById("inputCustomName").value = URLs[id].name || "";  
  var i, els, emailArea = document.getElementById("emailclientsArea");
  if (emailArea.dataset.remove_id) {
    els = document.querySelectorAll("#" + emailArea.dataset.remove_id + ",[for='" + emailArea.dataset.remove_id + "'],[data-id='" + emailArea.dataset.remove_id + "'],[data-id='" + emailArea.dataset.remove_id + "']+br");
    for (i=0; i<els.length; i++) {
      els[i].style.setProperty("display", els[i].nodeName === "INPUT" ? "inline-block" : "inline", "");
    }
  }
  emailArea.setAttribute("data-remove_id", id);
  els = document.querySelectorAll("#" + id + ",[for='" + id + "'],[data-id='" + id + "'],[data-id='" + id + "']+br");
  for (i=0; i<els.length; i++) {
    els[i].style.setProperty("display", "none", "");
  }
  addNewCustomURL();
};
var initializeCustom = function() {
  var URLs = JSON.parse(localStorage.getItem("mailtoURLs")) || {},
      emailArea = document.getElementById('emailclientsArea');
  while (emailArea.firstChild) {
    emailArea.removeChild(emailArea.firstChild);
  }
  createTag("legend", {}, {"textContent": chrome.i18n.getMessage('emailservice')}, emailArea);
  
  var i, id, ids = Object.keys(URLs), input;
  ids.sort(function(a,b) {
    if (URLs[a].name && !URLs[b].name) {return -1;}
    if (!URLs[a].name && URLs[b].name) {return 1;}
    if (URLs[a].name) {
      if (URLs[a].name.toLowerCase() > URLs[b].name.toLowerCase()) {return 1;}
      if (URLs[a].name.toLowerCase() < URLs[b].name.toLowerCase()) {return -1;}
    }
    if (URLs[a].url > URLs[b].url) {return 1;}
    return -1;
  });

  for (i=0; i<ids.length; i++) {
    id = ids[i];
    input = createTag("input", {"type": "radio", "name": "selectedMail", "id": id}, {}, emailArea);
    if (id === localStorage.getItem("selectedMail")) {
      input.checked = true;
    }
    input.addEventListener("change", setSetting, false);
    input.addEventListener("change", checkDoesSupportContextmenu, false);

    if (URLs[id].name) {
      createTag("label", {"for": id}, {"textContent": URLs[id].name, "title": URLs[id].url}, emailArea);
    } else {
      createTag("label", {"for": id, "class": "hasNoName"}, {"textContent": URLs[id].url}, emailArea);
    }

    input = createTag("a", {"href": "#customURL", "data-id": id}, {"textContent": chrome.i18n.getMessage('change')}, emailArea);
    input.addEventListener('click', changeCustomURL, false);

    if (ids.length > 1) {
      input = createTag("a", {"href": "#", "data-id": id}, {"textContent": chrome.i18n.getMessage('remove')}, emailArea);
      input.addEventListener('click', removeCustomURL, false);
    }

    if (i===0) {
      createTag("span", {"class": "saved", "id": "selectedMail"}, {"textContent": chrome.i18n.getMessage("saved")}, emailArea);
    }

    createTag("br", {}, {}, emailArea);
  }
  
  var div = createTag("div", {"id": "sysdefault"}, {}, emailArea);
  createTag("input", {"type": "radio", "name": "selectedMail", "id": "systemdefault"}, {}, div);
  createTag("label", {"for": "systemdefault"}, {"textContent": chrome.i18n.getMessage("systemdefault")}, div);
  createTag("br", {}, {}, div);
  
  if (i < 25) {
    input = createTag("a", {"href": "#customURL", "id": "addCustom"}, {"textContent": chrome.i18n.getMessage('customURL')}, emailArea);
    input.addEventListener('click', addNewCustomURL, false);
  }

  document.getElementById("customURL").style.display = "none";
  checkDoesSupportContextmenu();
};

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

// ------ CUSTOM URLS ------
// Validate the custom URL
var validateCustomURL = function() {
  if (/^https?\:\/\/([a-z0-9\-_\xE3-\xFF]+\.)+[a-z0-9]+\/.*\{(to|url)\}/.test(document.getElementById("inputCustom").value.trim())) {
    document.getElementById("submitCustom").disabled = false;
  } else {
    document.getElementById("submitCustom").disabled = true;
  }
};
document.getElementById("inputCustom").addEventListener("input", validateCustomURL, false);

var addCustomURL = function() {
  var i, id, URLs = JSON.parse(localStorage.getItem("mailtoURLs"));
  for (i=0; i<=Object.keys(URLs).length; i++) {
    if (!URLs.hasOwnProperty("custom" + i)) {
      id = "custom" + i;
      break;
    }
  }
  setSetting({target: {name: "selectedMail", id: id}});
  var newItem = {};
  newItem.url = document.getElementById("inputCustom").value.trim();
  if (document.getElementById("inputCustomName").value.trim()) {
    newItem.name = document.getElementById("inputCustomName").value.trim();
  }
  URLs[id] = newItem;
  localStorage.setItem("mailtoURLs", JSON.stringify(URLs));
  
  document.getElementById("inputCustom").value = "";
  document.getElementById("inputCustomName").value = "";
  
  var fieldset = document.getElementById("emailclientsArea");
  if (fieldset.dataset.remove_id) {
    removeCustomURL(fieldset.dataset.remove_id);
    fieldset.removeAttribute("data-remove_id");
  } else {
    initializeCustom();
    document.getElementById("selectedMail").style.opacity = 1;
    if (!hideInterval) {
      hideInterval = setInterval(saveLabelFadeOut, 200);
    }
  }
};

var pressedEnterKey = function(e) {
  if (e.keyCode === 13 && !document.getElementById("submitCustom").disabled) {
    addCustomURL();
    e.preventDefault();
  }
};
document.getElementById("inputCustom").addEventListener("keypress", pressedEnterKey, false);
document.getElementById("inputCustomName").addEventListener("keypress", pressedEnterKey, false);
document.getElementById("submitCustom").addEventListener("click", addCustomURL, false);


// ------ THE ASK ME EVERY TIME OPTION ------
document.getElementById("alwaysask").addEventListener("change", function(e) {
  setSetting(e);
  if (!e.target.checked) {
    localStorage.removeItem(e.target.name);
  }
  checkDoesSupportContextmenu();
}, false);
if (localStorage.getItem('askAlways')) {
  document.getElementById("alwaysask").checked = true;
}


// ------ THE PAGE ACTION OPTION ------
document.getElementById("sendLinkOfPage").addEventListener("change", function(e) {
  setSetting(e);
  if (!e.target.checked) {
    localStorage.removeItem(e.target.name);
  }
  chrome.runtime.getBackgroundPage(function(BG) {
    BG.setContextMenu();
  });
}, false);
if (localStorage.getItem('sendLinkPage')) {
  document.getElementById("sendLinkOfPage").checked = true;
}
var checkDoesSupportContextmenu = function() {
  var URLs = JSON.parse(localStorage.getItem("mailtoURLs"));
  var currentSelected = document.querySelector("[name='selectedMail']:checked");
  var supportsContextmenu = true;
  if (currentSelected && URLs[currentSelected.id] && !/\{(url|body|subject)\}/.test(URLs[currentSelected.id].url) && !document.getElementById("alwaysask").checked) {
    supportsContextmenu = false;
  }
  document.getElementById("contextmenuwarning").style.display = (supportsContextmenu ? "none" : "inline");
};

// ------ FINISHING TOUCH ------
// Translate a page into the users language
items = document.querySelectorAll("[data-i18n]");
for (i=0; i<items.length; i++) {
  var translation = chrome.i18n.getMessage(items[i].getAttribute("data-i18n"));
  if (items[i].value === "i18n") {
    items[i].value = translation;
  } else if (items[i].placeholder === "i18n") {
    items[i].placeholder = translation;
  } else {
    items[i].innerText = translation;
  }
}

document.getElementById('explainCustom').innerHTML = document.getElementById('explainCustom').innerText.replace("<a>", '<a href="#" id="explainLink">'); 
if (document.getElementById('explainLink')) {
  document.getElementById('explainLink').addEventListener("click", function() {
    window.open('https://code.google.com/p/mailto-chromeextension/wiki/AddCustomUrl');
  });
}

initializeCustom();