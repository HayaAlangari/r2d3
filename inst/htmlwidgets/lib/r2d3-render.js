function R2D3(el, width, height) {
  var self = this;
  var x = null;
  var version = null;
  
  self.data = null;
  self.root = self.svg = self.canvas = null;
  self.width = 0;
  self.height = 0;
  self.options = null;
  self.resizer = null;
  self.renderer = null;
  self.rendererDefaut = true;
  self.captureErrors = null;
  self.theme = {};
  
  self.setX = function(newX) {
    x = newX;
    self.data = x.data;
    
    if (x.type == "data.frame") {
      self.data = HTMLWidgets.dataframeToD3(self.data);
    }
    
    if (x.theme) {
      self.theme = themeCapable() ? x.theme.runtime : x.theme.default;
    }
    
    self.options = x.options;
  };
  
  self.setContainer = function(container) {
    self.container = container;
  };
  
  self.setRoot = function(root) {
    self.root = self.svg = self.canvas = root;
  };
  
  self.createRoot = function() {
    if (self.root !== null) {
      self.d3().select(el).select(self.container).remove();
      self.root = null;
    }
    
    var root = self.d3().select(el).append(self.container)
      .attr("width", self.width)
      .attr("height", self.height);
      
    if (self.theme.background) root.style("background", self.theme.background);
    if (self.theme.foreground) {
      root.style("fill", self.theme.foreground);
      root.style("color", self.theme.foreground);
    }
      
    self.setRoot(root);
  };
  
  self.setWidth = function(width) {
    self.width = width;
  };
  
  self.setHeight = function(height) {
    self.height = height;
  };
  
  self.onRender = function(renderer) {
    self.renderer = renderer;
    self.rendererDefaut = false;
  };
  
  self.onResize = function(resizer) {
    self.resizer = resizer;
  };
  
  self.render = function() {
    if (self.renderer === null) return;
    
    try {
      self.renderer(self.data, self.root, self.width, self.height, self.options);
    }
    catch (err) {
      self.showError(err, null, null);
    }
  };
  
  self.resize = function() {
    if (self.resizer === null) return;
    try {
      self.resizer(self.width, self.height);
    }
    catch (err) {
      self.showError(err, null, null);
    }
  };
  
  self.addScript = function(script) {
    var el = document.createElement("script");
    el.type = "text/javascript";
    el.text = script;
    
    self.captureErrors = function(msg, url, lineNo, columnNo, error) {
      self.showError({
          message: msg,
          stack: null
        }, lineNo, columnNo);
    };

    document.head.appendChild(el);
    self.captureErrors = null;
  };
  
  self.addStyle = function(style) {
    if (!style) return;
    
    var el = document.createElement("style");
            
    el.type = "text/css";
    if (el.styleSheet) {
      el.styleSheet.cssText = style;
    } else {
      el.appendChild(document.createTextNode(style));
    }
    
    document.head.appendChild(el);
  };
  
  self.setVersion = function(newVersion) {
    version = newVersion;
  };
  
  self.d3 = function() {
    switch(version) {
      case 3:
        return d3;
      case 4:
        return d3v4;
      case 5:
        return d3v5;
    }
  };
  
  var consoleLog = function(data) {
    console.log(data);
    
    var entry = document.getElementById("r2d3-console-entry");
    if (!entry) {
      entry = document.createElement("div");
      entry.id = "r2d3-console-entry";
      entry.style.bottom = "0";
      entry.style.left = "0";
      entry.style.right = "0";
      entry.style.background = "rgb(244, 248, 249)";
      entry.style.border = "1px solid #d6dadc";
      entry.style.padding = "8px 15px 8px 15px";
      entry.style.position = "absolute";
      entry.style.fontFamily = "'Lucida Sans', 'DejaVu Sans', 'Lucida Grande', 'Segoe UI', Verdana, Helvetica, sans-serif, serif";
      entry.style.fontSize = "9pt";
      el.appendChild(entry);
      
      entry.style.transform = "translateY(40px)";
      entry.style.opacity = "0";
      entry.style.transition = "all 0.25s";
      
      entry.onmouseenter = function() {
        consoleHovering = true;
      };
      
      entry.onmouseleave = function() {
        consoleHovering = false;
      };
      
      setTimeout(function() {
        entry.style.transform = "translateY(0)";
        entry.style.opacity = "1";
        entry.style.transition = "all 0.5s";
      }, 50);
    }
    
    entry.innerText = data;
    
    clearTimeout(consoleTimeout);
    consoleTimeout = setTimeout(function() {
      var hideConsole = function() {
        entry.style.transform = "translateY(-60px)";
        entry.style.opacity = "0";
        entry.addEventListener("transitionend", function(event) {
          entry = document.getElementById("r2d3-console-entry");
          if (entry) el.removeChild(entry);
          consoleHovering = false;
        });
      };
      
      if (consoleHovering) {
        entry.onmouseleave = hideConsole;
      }
      else {
        hideConsole();
      }
    }, 3000);
  };
  var consoleTimeout = null;
  var consoleHovering = false;
  var createConsoleOverride = function(type) {
    return function(data) {
      consoleLog(type + data);
    };
  };
  
  self.console = {
    assert: console.assert,
    clear: console.clear,
    count: console.count,
    error: createConsoleOverride("Error: "),
    group: console.group,
    groupCollapsed: console.groupCollapsed,
    groupEnd: console.groupEnd,
    info: createConsoleOverride("Info: "),
    log: createConsoleOverride(""),
    table: console.table,
    time: console.time,
    timeEnd: console.timeEnd,
    trace: console.trace,
    warn: console.warn
  };
  
  self.callD3Script = function() {
    var d3Script = self.d3Script;
    
    try {
      d3Script(self.d3(), self, self.data, self.root, self.width, self.height, self.options, self.theme, self.console);
    }
    catch (err) {
      self.showError(err, null, null);
    }
  };
  
  self.widgetRender = function(x) {
    self.setX(x);
    self.setWidth(width);
    self.setHeight(height);
    
    if (!self.root) {
      self.setVersion(x.version);
      self.addScript(x.script);
      self.addStyle(x.style);
      self.d3Script = d3Script;
      self.setContainer(x.container);
      
      self.createRoot();
      
      self.callD3Script();
    }
    
    self.render();
    
    if (self.renderer === null) {
      self.onRender(function(data, container, width, height, options) {
        self.callD3Script();
      });
    }
    
    if (self.resizer === null) {
      self.resizer = function(width, height) {
        self.createRoot();
        self.callD3Script();
        if (!self.rendererDefaut) self.render();
      };
    }
  };
  
  self.debounce = function(f, wait) {
    var timeout = null;
    return function() {
      if (timeout) window.clearTimeout(timeout);
      timeout = window.setTimeout(f, wait);
    };
  };
  
  self.resizeDebounce = self.debounce(self.resize, 100);
  
  self.widgetResize = function(width, height) {
    self.root
      .attr("width", width)
      .attr("height", height);

    self.setWidth(width);
    self.setHeight(height);
    
    self.resizeDebounce();
  };
  
  var openSource = function(filename, line, column, domain, highlight) {
    if (window.parent.postMessage) {
      window.parent.postMessage({
        message: "openfile",
        source: "r2d3",
        file: filename,
        line: line,
        column: column,
        highlight: highlight
      }, domain);
    }
  };
  
  var themesLoaded = false;
  var registerTheme = function(domain) {
    domain = domain ? domain : window.location.origin;
    if (window.parent.postMessage) {
      window.addEventListener('message', function(event) {
        if (typeof event.data != 'object')
          return;
      	if (event.origin !== domain)
      	  return;
    	  if (event.data.message !== "ontheme")
          return;
          
        document.body.style.background = event.data.background;
        
        self.theme.background = event.data.background;
        self.theme.foreground = event.data.foreground;
      	
      	// resize to give script chance to pick new theme
      	if (themesLoaded) self.resize();
      	themesLoaded = true;
      }, false);
      
      window.parent.postMessage({
        message: "ontheme",
        source: "r2d3"
      }, domain);
    }
  };
  
  var errorObject = null;
  var errorLine = null;
  var errorColumn = null;
  var errorFile = null;
  var errorHighlightOnce = false;
  var hostDomain = null;
  
  var queryParameter = function(param) {
    var query = window.location.search.substring(1);
    var entries = query.split('&');
    
    for (var idxEntry = 0; idxEntry < entries.length; idxEntry++) {
        var params = entries[idxEntry].split('=');
        if (decodeURIComponent(params[0]) == param) {
            return decodeURIComponent(params[1]);
        }
    }
    
    return null;
  };
  
  var themeCapable = function() {
    return queryParameter("capabilities") === "1";
  };
  
  var registerMessageListeners = function(event) {
    if (!themeCapable()) {
      hostDomain = null;
    } else {
      hostDomain = queryParameter("host");
      registerTheme(hostDomain);
    }
  };
  
  var cleanStackTrace = function(stack) {
    var cleaned = stack.substr(0, stack.indexOf("at d3Script"));
    cleaned = cleaned.replace(new RegExp("\\(.*/session/view[^/]*/lib/[^/]+/", "g"), "(");
    cleaned = cleaned.replace(new RegExp("\\(.*/session/view[^/]*/", "g"), "(");
    
    return cleaned;
  };
  
  var parseLineFileRef = function(line) {
    var lines = x.script.split("\n");
    var header = "/* R2D3 Source File: ";
    var file = null;
    for (var maybe = line; line && maybe >= 0; maybe--) {
      if (lines[maybe].includes(header)) {
        var data = lines[maybe].split(header)[1];
        var source = data.trim();
        
        line = line - (maybe + 1);
        file = source;
      }
    }
      
    return {
      file: file,
      line: line
    };
  };
  
  var parseCallstackRef = function(callstack) {
    var reg = new RegExp("at [^\\n]+ \\(<anonymous>:([0-9]+):([0-9]+)\\)");
    var matches = reg.exec(callstack);
    if (matches && matches.length === 3) {
      
      var line = parseInt(matches[1]);
      var column = parseInt(matches[2]);
      var file = null;
      var lineRef = parseLineFileRef(line);
      if (lineRef) {
        file = lineRef.file;
        line = lineRef.line;
      }
      
      return {
        file: file,
        line: line,
        column: column
      };
    }
    else {
      return null;
    }
  };
  
  var createSourceLink = function(error, line, column, domain) {
    var linkEl = document.createElement("a");
    linkEl.innerText = "(" + error + "#" + line + ":" + column + ")";
    linkEl.href = "#";
    linkEl.color = "#4531d6";
    linkEl.style.display = "inline-block";
    linkEl.style.textDecoration = "none";
    linkEl.onclick = function() {
      openSource(error, line, column, domain, false);
    };
    
    return linkEl;
  };
  
  var showErrorImpl = function() {
    var message = errorObject, callstack = "";
    
    if (errorObject.message) message = errorObject.message;
    if (errorObject.stack) callstack = errorObject.stack;
    
    if (errorLine === null || errorColumn === null) {
      var parseResult = parseCallstackRef(callstack);
      if (parseResult) {
        errorFile = parseResult.file;
        errorLine = parseResult.line;
        errorColumn = parseResult.column;
      }
    }
    else {
      var parseLineResult = parseLineFileRef(errorLine);
      if (parseLineResult) {
        errorFile = parseLineResult.file;
        errorLine = parseLineResult.line;
      }
    }
    
    if (errorFile) {
      message = message + " in ";
    }
    
    var container = document.getElementById("r2d3-error-container");
    if (!container) {
      container = document.createElement("div");
      el.appendChild(container);
    }
    else {
      container.innerHTML = "";
    }
    
    container.id = "r2d3-error-container";
    container.style.fontFamily = "'Lucida Sans', 'DejaVu Sans', 'Lucida Grande', 'Segoe UI', Verdana, Helvetica, sans-serif, serif";
    container.style.fontSize = "9pt";
    container.style.color = "#444";
    container.style.position = "absolute";
    container.style.top = "0";
    container.style.left = "8px";
    container.style.right = "8px";
    container.style.overflow = "scroll";
    container.style.lineHeight = "16px";
    
    var header = document.createElement("div");
    header.innerText = "Error: " + message.replace("\n", "");
    header.style.marginTop = "8px";
    header.style.background = "rgb(244, 248, 249)";
    header.style.border = "1px solid #d6dadc";
    header.style.padding = "8px 15px 8px 15px";
    header.style.lineHeight = "24px";
    container.appendChild(header);
    
    if (errorFile) {
      if (hostDomain) {
        if (!errorHighlightOnce) {
          openSource(errorFile, errorLine, errorColumn, hostDomain, true);
          errorHighlightOnce = true;
        }
        
        var linkEl = createSourceLink(errorFile, errorLine, errorColumn, hostDomain);
        header.appendChild(linkEl);
      }
      else {
        header.innerText = "Error: " + message.replace("\n", "") + " " + errorFile + "#" + errorLine + ":" + errorColumn;
      }
    }
    
    if (callstack) {
      var stack = document.createElement("div");
      var cleanStack = cleanStackTrace(callstack);
      stack.style.display = "block";
      stack.style.border = "1px solid #d6dadc";
      stack.style.padding = "12px 15px 12px 15px";
      stack.style.background = "#FFFFFF";
      stack.style.borderTop = "0";
      
      var allEmpty = true;
      var entries = cleanStack.split("\n");
      for (var idxEntry in entries) {
        var entry = entries[idxEntry];
        var stackEl = document.createElement("div");
        
        var stackRes = parseCallstackRef(entry);
        if (idxEntry === "0") {
          header.appendChild(document.createElement("br"));
          header.appendChild(document.createTextNode(entry));
        } else if (hostDomain && stackRes) {
          stackEl.innerText = entry.substr(0, entry.indexOf("(<anony"));
          var stackLinkEl = createSourceLink(stackRes.file, stackRes.line, stackRes.column, hostDomain);
          stackEl.appendChild(stackLinkEl);
        }
        else {
          stackEl.innerText = entry;
        }
        
        if (stackEl.innerHTML.trim().length > 0)  stack.appendChild(stackEl);
      }
      
      if (stack.childElementCount > 0)
        container.appendChild(stack);
    }
  };
  
  self.showError = function(error, line, column) {
    errorObject = error;
    errorLine = line;
    errorColumn = column;
    
    showErrorImpl();
  };
  
  window.onerror = function (msg, url, lineNo, columnNo, error) {
    if (self.captureErrors) {
      self.captureErrors(msg, url, lineNo, columnNo, error);
    }
    
    return false;
  };
  
  registerMessageListeners();
}