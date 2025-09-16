// Code block enhancer for Jekyll blog
// This file should be placed in /assets/js/code-enhancer.js

(function() {
  'use strict';
  
  function enhanceCodeBlocks() {
    // Try multiple selectors to find code blocks
    var selectors = [
      'pre > code',
      'div.highlight > pre.highlight > code',
      'figure.highlight > pre > code',
      '.highlighter-rouge pre code',
      '.language-kusto',
      '.language-kql',
      'pre code'
    ];
    
    var codeBlocks = [];
    
    for (var i = 0; i < selectors.length; i++) {
      var found = document.querySelectorAll(selectors[i]);
      if (found && found.length > 0) {
        for (var j = 0; j < found.length; j++) {
          if (!found[j].closest('.custom-code-block')) {
            codeBlocks.push(found[j]);
          }
        }
      }
    }
    
    if (codeBlocks.length === 0) {
      return;
    }
    
    codeBlocks.forEach(function(codeElement) {
      processCodeBlock(codeElement);
    });
  }
  
  function processCodeBlock(codeElement) {
    var codeText = codeElement.textContent || '';
    var classes = codeElement.className || '';
    var langMatch = classes.match(/language-([^\s]+)/);
    var language = langMatch ? langMatch[1].toLowerCase() : 'text';
    
    var lines = codeText.split('\n');
    if (lines[lines.length - 1] === '') {
      lines.pop();
    }
    
    // Create wrapper
    var wrapper = document.createElement('div');
    wrapper.className = 'custom-code-block';
    
    // Create header
    var header = document.createElement('div');
    header.className = 'code-header';
    
    // Traffic lights
    var trafficLights = document.createElement('div');
    trafficLights.className = 'traffic-lights';
    trafficLights.innerHTML = '<span class="dot red"></span><span class="dot yellow"></span><span class="dot green"></span>';
    
    // Language label
    var langLabel = document.createElement('span');
    langLabel.className = 'lang-label';
    langLabel.textContent = '// ' + formatLanguage(language);
    
    // Copy button
    var copyBtn = document.createElement('button');
    copyBtn.type = 'button';
    copyBtn.className = 'copy-btn';
    copyBtn.setAttribute('aria-label', 'Copy code');
    copyBtn.innerHTML = '<svg class="copy-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2"><rect x="9" y="9" width="13" height="13" rx="2" ry="2"></rect><path d="M5 15H4a2 2 0 0 1-2-2V4a2 2 0 0 1 2-2h9a2 2 0 0 1 2 2v1"></path></svg><svg class="check-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2.5"><polyline points="20 6 9 17 4 12"></polyline></svg>';
    
    header.appendChild(trafficLights);
    header.appendChild(langLabel);
    header.appendChild(copyBtn);
    
    // Create code container
    var container = document.createElement('div');
    container.className = 'code-container';
    
    var pre = document.createElement('pre');
    pre.className = 'code-pre';
    
    var code = document.createElement('code');
    code.className = 'code-content language-' + language;
    
    // Process lines
    lines.forEach(function(line) {
      var lineDiv = document.createElement('div');
      lineDiv.className = 'code-line';
      
      if (language === 'kql' || language === 'kusto') {
        highlightKQLLine(line, lineDiv);
      } else {
        lineDiv.textContent = line;
      }
      
      code.appendChild(lineDiv);
    });
    
    pre.appendChild(code);
    container.appendChild(pre);
    wrapper.appendChild(header);
    wrapper.appendChild(container);
    
    // Find element to replace
    var target = codeElement.parentElement;
    while (target && target.parentElement) {
      if (target.className && (target.className.indexOf('highlight') !== -1 || target.tagName === 'PRE')) {
        target.parentElement.replaceChild(wrapper, target);
        break;
      }
      if (target.tagName === 'PRE') {
        target.parentElement.replaceChild(wrapper, target);
        break;
      }
      target = target.parentElement;
    }
    
    // Setup copy functionality
    copyBtn.addEventListener('click', function(e) {
      e.preventDefault();
      
      navigator.clipboard.writeText(codeText).then(function() {
        copyBtn.classList.add('copied');
        setTimeout(function() {
          copyBtn.classList.remove('copied');
        }, 2000);
      }).catch(function() {
        // Fallback
        var textarea = document.createElement('textarea');
        textarea.value = codeText;
        textarea.style.position = 'absolute';
        textarea.style.left = '-9999px';
        document.body.appendChild(textarea);
        textarea.select();
        document.execCommand('copy');
        document.body.removeChild(textarea);
        
        copyBtn.classList.add('copied');
        setTimeout(function() {
          copyBtn.classList.remove('copied');
        }, 2000);
      });
    });
  }
  
  function highlightKQLLine(text, container) {
    var keywords = ['where', 'extend', 'project', 'summarize', 'by', 'in', 'contains',
                    'has_any', 'and', 'or', 'not', 'let', 'join', 'on', 'union',
                    'parse_json', 'tostring', 'toint', 'todouble', 'tobool', 'toscalar',
                    'distinct', 'top', 'sort', 'limit', 'take', 'count', 'as'];
    
    var tokens = [];
    var current = '';
    var inString = false;
    var stringChar = '';
    
    for (var i = 0; i < text.length; i++) {
      var char = text[i];
      
      if (!inString && (char === '"' || char === "'")) {
        if (current) {
          tokens.push({text: current, type: 'text'});
          current = '';
        }
        inString = true;
        stringChar = char;
        current = char;
      } else if (inString && char === stringChar) {
        current += char;
        tokens.push({text: current, type: 'string'});
        current = '';
        inString = false;
      } else if (!inString && /[=<>!|&+\-*/%(),]/.test(char)) {
        if (current) {
          tokens.push({text: current, type: 'text'});
          current = '';
        }
        tokens.push({text: char, type: 'operator'});
      } else if (!inString && /\s/.test(char)) {
        if (current) {
          tokens.push({text: current, type: 'text'});
          current = '';
        }
        tokens.push({text: char, type: 'space'});
      } else {
        current += char;
      }
    }
    
    if (current) {
      tokens.push({text: current, type: inString ? 'string' : 'text'});
    }
    
    // Process tokens
    tokens.forEach(function(token) {
      if (token.type === 'string') {
        var span = document.createElement('span');
        span.className = 'hl-string';
        span.textContent = token.text;
        container.appendChild(span);
      } else if (token.type === 'operator') {
        var span = document.createElement('span');
        span.className = 'hl-operator';
        span.textContent = token.text;
        container.appendChild(span);
      } else if (token.type === 'space') {
        container.appendChild(document.createTextNode(token.text));
      } else {
        // Check if it's a keyword or number
        if (keywords.indexOf(token.text.toLowerCase()) !== -1) {
          var span = document.createElement('span');
          span.className = 'hl-keyword';
          span.textContent = token.text;
          container.appendChild(span);
        } else if (/^\d+\.?\d*$/.test(token.text)) {
          var span = document.createElement('span');
          span.className = 'hl-number';
          span.textContent = token.text;
          container.appendChild(span);
        } else if (token.text[0] && token.text[0] === token.text[0].toUpperCase() && /[A-Z]/.test(token.text[0])) {
          var span = document.createElement('span');
          span.className = 'hl-property';
          span.textContent = token.text;
          container.appendChild(span);
        } else {
          container.appendChild(document.createTextNode(token.text));
        }
      }
    });
  }
  
  function formatLanguage(lang) {
    var langMap = {
      'js': 'JavaScript',
      'javascript': 'JavaScript', 
      'ts': 'TypeScript',
      'typescript': 'TypeScript',
      'py': 'Python',
      'python': 'Python',
      'kql': 'KQL',
      'kusto': 'KQL',
      'html': 'HTML',
      'css': 'CSS',
      'json': 'JSON',
      'bash': 'Bash',
      'sql': 'SQL',
      'ruby': 'Ruby',
      'java': 'Java',
      'go': 'Go'
    };
    
    return langMap[lang] || lang.toUpperCase();
  }
  
  // Initialize when DOM is ready
  if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', function() {
      setTimeout(enhanceCodeBlocks, 100);
    });
  } else {
    setTimeout(enhanceCodeBlocks, 100);
  }
})();