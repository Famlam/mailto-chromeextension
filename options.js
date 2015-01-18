"use strict";

var preventSetService = false;

$("#buttonOpenServicesList").click(function() {
  $("#servicesList").slideDown(300);
  $("#currentService").slideUp(300);
});

chrome.storage.local.get("contextmenu", function(obj) {
  $("#contextmenu_enable")
    .prop("checked", obj.contextmenu === true)
    .change(function(e) {
      chrome.storage.local.set({"contextmenu": e.target.checked});
    });
});

chrome.storage.local.get("currentService", function(obj) {
  if (obj.currentService && obj.currentService.id) {
    $("a", "#currentService")
      .text(obj.currentService.name || obj.currentService.url);
    $("#servicesList")
      .attr("data-current", obj.currentService.id);
    if (!contextMenuSupported(obj.currentService.url)) {
      $("#contextmenu_unsupported").css("display", "block");
      $("#contextmenu_enable").prop("disabled", true);
    }
  } else {
    $("#servicesList").css("display", "block");
    $("#currentService").css("display", "none");
  }
  initializeServicesList();
});

var contextMenuSupported = function(url) {
  return !url || /\{(url|body|subject)\}/.test(url);
};

var closeOpenForms = function() {
  $("#servicesList form")
    .filter(":visible")
    .each(function(i, form) {
      $(form).css("display", "none");
      $(form).prev().css("display", "inline");
      $(form).prev().prev().prop("disabled", false);
      chrome.storage.local.get("mailtoURLs", function(obj) {
        if (form.name !== "service_new") {
          $("input[id^='service_new_name_']", form).val(obj.mailtoURLs[form.dataset.id].name || "");
          $("input[id^='service_new_url_']", form).val(obj.mailtoURLs[form.dataset.id].url);
        } else {
          $("input[placeholder]", form).val("");
        }
      });
    });
};
var fnOpenForm = function(e) {
  closeOpenForms();
  var target = $("#service_" + e.target.dataset.id);
  $(target).prop("disabled", true);
  $(target).nextUntil("form").each(function(i, el) {
    $(el).css("display", "none");
  });
  $(target).nextAll("form").first().css("display", "inline-block");
};

var initializeServicesList = function() {
  var URLvalidationPattern = "^\\s*https?\\:\\/\\/([a-z0-9\\-_\\xE3-\\xFF]+\\.)+[a-z0-9]+\\/.*\\{(to|url)\\}.*";

  var preventRemoveAllServices = function() {
    if ($(".removeLabel").length === 1) {
      $(".pipe, .removeLabel").css("display", "none");
    } else {
      $(".pipe, .removeLabel").css("display", "inline");
    }
  };
  
  var fnSetDefaultService = function(e) {
    if (preventSetService) {
      return;
    }
    var id, url, name;
    if (e.target.checked) {
      id = e.target.id.substring(8);
      if (id === "askEveryTime") {
        name = $("label[for='service_askEveryTime']").text();
        url = "";
      } else {
        name = $("label[for='service_" + id + "']").text();
        url = $("#service_new_url_" + id).val().trim();
        if (new RegExp(URLvalidationPattern).test(url) === false) {
          return;
        }
      }
      if (!contextMenuSupported(url)) {
        $("#contextmenu_unsupported").fadeIn(300);
        $("#contextmenu_enable")
          .prop("disabled", true)
          .prop("checked", false)
          .change();
      } else {
        $("#contextmenu_unsupported").fadeOut(300);
        $("#contextmenu_enable").prop("disabled", false);
      }
      chrome.storage.local.set({"currentService": {id: id, name: name, url: url}});
      $("a", "#currentService")
        .text(name || url);
      $("#servicesList")
        .attr("data-current", id);
      $("#currentService").slideDown(300);
      $("#servicesList").slideUp(300);
    }
  };
  var createServiceEntry = function(obj, key) {
    var container = $("<div>");
    $("<input>")
      .attr("type", "radio")
      .attr("name", "emailservice")
      .attr("id", "service_" + key)
      .prop("checked", key === $("#servicesList").attr("data-current"))
      .change(fnSetDefaultService)
      .appendTo(container);
    var hoverspan = $("<span>")
      .appendTo(container);
    $("<label>")
      .attr("for", "service_" + key)
      .text(obj.mailtoURLs[key].name || obj.mailtoURLs[key].url)
      .attr("title", obj.mailtoURLs[key].url)
      .css("font-style", obj.mailtoURLs[key].name ? "normal" : "italic")
      .appendTo(hoverspan);
    var span = $("<span>")
      .addClass("service_modify")
      .appendTo(hoverspan);
    $(document.createTextNode("("))
      .appendTo(span);
    $("<a>")
      .text(chrome.i18n.getMessage("change"))
      .attr("data-id", key)
      .click(fnOpenForm)
      .appendTo(span);
    $("<span>")
      .addClass("pipe")
      .text(" | ")
      .appendTo(span);
    $("<a>")
      .addClass("removeLabel")
      .text(chrome.i18n.getMessage("remove"))
      .click(removeService)
      .attr("data-id", key)
      .appendTo(span);
    $(document.createTextNode(")"))
      .appendTo(span);
    var form = $("<form>")
      .attr("name", "service_new_" + key)
      .submit(changeService)
      .attr("data-id", key)
      .appendTo(container);
    $("<input>")
      .attr("name", "service_new_" + key)
      .attr("id", "service_new_name_" + key)
      .attr("type", "text")
      .attr("maxlength", "256")
      .attr("placeholder", chrome.i18n.getMessage("newServiceNameDescription"))
      .val(obj.mailtoURLs[key].name || "")
      .appendTo(form);
    $("<input>")
      .attr("name", "service_new_" + key)
      .attr("id", "service_new_url_" + key)
      .attr("type", "url")
      .attr("spellcheck", "false")
      .attr("maxlength", "1024")
      .attr("placeholder", chrome.i18n.getMessage("newServiceURLdescription"))
      .attr("required", "required")
      .attr("pattern", URLvalidationPattern)
      .val(obj.mailtoURLs[key].url)
      .appendTo(form);
    $("<input>")
      .attr("name", "service_new_" + key)
      .attr("type", "submit")
      .val(chrome.i18n.getMessage("add"))
      .appendTo(form);
    span = $("<span>")
      .appendTo(form);
    $(document.createTextNode("("))
      .appendTo(span);
    $("<a>")
      .attr("href", "https://code.google.com/p/mailto-chromeextension/wiki/AddCustomUrl")
      .attr("target", "_blank")
      .attr("title", chrome.i18n.getMessage("getHelpTitle"))
      .text(chrome.i18n.getMessage("getHelp"))
      .appendTo(span);
    $(document.createTextNode(")"))
      .appendTo(span);
    $("<br>")
      .appendTo(container);
      
    return $(container).children().detach();
  };
  var addNewService = function(e) {
    chrome.storage.local.get("mailtoURLs", function(obj) {
      var i;
      for (i=0; i<Object.keys(obj.mailtoURLs).length; i++) {
        if (!obj.mailtoURLs.hasOwnProperty("custom" + i)) {
          obj.mailtoURLs["custom" + i] = {
            name: $("#service_new_name").val(),
            url: $("#service_new_url").val()
          };
          break;
        }
      }
      chrome.storage.local.set({"mailtoURLs": obj.mailtoURLs});
      $(createServiceEntry(obj, "custom" + i))
        .insertBefore($("#addNewServicesBeforeMe"))
        .filter(":visible")
        .css("display", "none")
        .fadeIn(300, function() {
          $("#service_custom" + i).prop("checked", true).change();
          $("#service_linkAddNew").css("display", "inline");
          $("#service_new").prop("disabled", false);
          $("form[name='service_new']").css("display", "none");
          preventRemoveAllServices();
        });
    });
    e.preventDefault();
  };
  var removeService = function(e) {
    closeOpenForms();
    chrome.storage.local.get("mailtoURLs", function(obj) {
      var id = e.target.dataset.id;
      delete obj.mailtoURLs[id];
      $(e.target).parent().remove();
      chrome.storage.local.set({"mailtoURLs": obj.mailtoURLs});
      if ($("#service_" + id).prop("checked")) {
        chrome.storage.local.remove("currentService");
        $("#contextmenu_unsupported").fadeOut(300);
        $("#contextmenu_enable").prop("disabled", false);
      }
      $("#service_" + id).attr("disabled", "disabled");
      $("#service_" + id).prev().nextUntil("input[type='radio']:not([disabled]),#addNewServicesBeforeMe").fadeOut(300, function() {
        $(this).remove();
        preventRemoveAllServices();
      });
    });
  };
  var changeService = function(e) {
    chrome.storage.local.get("mailtoURLs", function(obj) {
      var id = e.target.dataset.id;
      obj.mailtoURLs[id] = {
        name: $("#service_new_name_" + id).val(),
        url: $("#service_new_url_" + id).val()
      };
      chrome.storage.local.set({"mailtoURLs": obj.mailtoURLs});
      $(createServiceEntry(obj, id))
        .insertBefore($("#service_" + id).nextAll("input[type='radio']").first())
        .filter(":visible")
        .css("display", "none")
        .fadeIn(300, function() {
          $("#service_" + id).prop("checked", true).change();
        });
      $("#service_" + id).prev().nextUntil("input[type='radio']:not([disabled]),#addNewServicesBeforeMe").remove();
    });
    e.preventDefault();
  };
  chrome.storage.local.get("mailtoURLs", function(obj) {
    var i, keys = Object.keys(obj.mailtoURLs);
    keys.sort(function(a, b) {
      if (!obj.mailtoURLs[a].name && obj.mailtoURLs[b].name) {return 1;}
      if (obj.mailtoURLs[a].name && !obj.mailtoURLs[b].name) {return -1;}
      if (obj.mailtoURLs[a].name.toLowerCase() === obj.mailtoURLs[b].name.toLowerCase()) {
        return obj.mailtoURLs[a].url < obj.mailtoURLs[b].url ? -1 : 1;
      }
      return obj.mailtoURLs[a].name.toLowerCase() < obj.mailtoURLs[b].name.toLowerCase() ? -1 : 1;
    });
    for (i=0; i<keys.length; i++) {
      $(createServiceEntry(obj, keys[i])).insertBefore($("#addNewServicesBeforeMe"));
    }
    
    preventRemoveAllServices();
    
    $("#service_askEveryTime")
      .prop("checked", $("#servicesList").attr("data-current") === "askEveryTime")
      .change(fnSetDefaultService);
    $("#service_new")
      .click(fnOpenForm);
    $("#service_linkAddNew")
      .click(fnOpenForm);
    $("form[name='service_new']")
      .submit(addNewService);
    $("#service_new_url")
      .attr("pattern", URLvalidationPattern);
  });
};

chrome.storage.local.get("disableURLPatterns", function(obj) {
  // Stuff related to the exclude pattern list
  var fillListOfDisablePatterns = function(list) {
    $("#disableURLPatterns").empty();
    var i;
    for (i=0; i<list.length; i++) {
      if (list[i] !== $("#disableURLPatterns_newInput").attr("data-removeAfterAdd")) {
        $("<option>")
          .text(list[i])
          .appendTo($("#disableURLPatterns"));
      }
    }
    $("#disableURLPatterns").change();
  };
  
  if (obj.disableURLPatterns) {
    fillListOfDisablePatterns(obj.disableURLPatterns);
  }
  
  $("form[name='disableURLPatterns_addPattern']").submit(function(e) {
    chrome.storage.local.get("disableURLPatterns", function(obj) {
      var newPatterns = obj.disableURLPatterns || [];
      var removeChangedPattern = $("#disableURLPatterns_newInput").attr("data-removeAfterAdd");
      if (removeChangedPattern) {
        if (newPatterns.indexOf(removeChangedPattern) !== -1) {
          newPatterns.splice(newPatterns.indexOf(removeChangedPattern), 1);
        }
        $("#disableURLPatterns_newInput").removeAttr("data-removeAfterAdd");
      }
      newPatterns.push($("#disableURLPatterns_newInput").val());
      newPatterns = $.unique(newPatterns).sort();
      chrome.storage.local.set({"disableURLPatterns": newPatterns});
      fillListOfDisablePatterns(newPatterns);
      $("#disableURLPatterns_newInput").val("");
    });
    e.preventDefault();
  });
  
  $("#disableURLPatterns").change(function() {
    if (this.selectedOptions.length === 1) {
      $("#disableURLPatterns_change").prop("disabled", false);
      $("#disableURLPatterns_remove").prop("disabled", false);
    } else {
      $("#disableURLPatterns_change").prop("disabled", true);
      $("#disableURLPatterns_remove").prop("disabled", this.selectedOptions.length === 0);
    }
  });
  
  var deletePattern = function(patterns) {
    chrome.storage.local.get("disableURLPatterns", function(obj) {
      var i, newPatterns = [];
      for (i=0; i<obj.disableURLPatterns.length; i++) {
        if (patterns.indexOf(obj.disableURLPatterns[i]) === -1) {
          newPatterns.push(obj.disableURLPatterns[i]);
        }
      }
      chrome.storage.local.set({"disableURLPatterns": newPatterns});
      fillListOfDisablePatterns(newPatterns);
    });
  };
  
  $("#disableURLPatterns_remove").click(function() {
    var i, patterns = [];
    var options = $("#disableURLPatterns").prop("selectedOptions");
    for (i=0; i<options.length; i++) {
      patterns.push(options[i].textContent);
    }
    deletePattern(patterns);
  });
  $("#disableURLPatterns").keydown(function(e) {
    if (e.keyCode === 46 && !$("#disableURLPatterns_remove").prop("disabled")) {
      $("#disableURLPatterns_remove").click();
    }
  });
  $("#disableURLPatterns_change").click(function() {
    var option = $("#disableURLPatterns").prop("selectedOptions")[0];
    $("#disableURLPatterns_newInput").val(option.textContent);
    $("#disableURLPatterns_newInput").attr("data-removeAfterAdd", option.textContent);
    chrome.storage.local.get("disableURLPatterns", function(obj) {
      fillListOfDisablePatterns(obj.disableURLPatterns);
    });
  });
  $("#disableURLPatterns").dblclick(function() {
    if (!$("#disableURLPatterns_change").prop("disabled")) {
      $("#disableURLPatterns_change").click();
    }
  });
  
  var inputMaxWidth = 0;
  $("input[type='button'],input[type='submit']", "#disableOnWebsites")
    .each(function(i, el) {
      inputMaxWidth = Math.max(inputMaxWidth, $(el).width());
    })
    .width(inputMaxWidth);
});

$("[data-i18nText]").each(function() {
  $(this).text(chrome.i18n.getMessage(this.dataset.i18ntext));
});
$("[data-i18nTitle]").each(function() {
  $(this).attr("title", chrome.i18n.getMessage(this.dataset.i18ntitle));
});
$("[data-i18nPlaceholder]").each(function() {
  $(this).attr("placeholder", chrome.i18n.getMessage(this.dataset.i18nplaceholder));
});
$("[data-i18nValue]").each(function() {
  $(this).val(chrome.i18n.getMessage(this.dataset.i18nvalue));
});
