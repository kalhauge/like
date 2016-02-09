'use strict';

// TODO: make this into a Playground class

function insertPlayground(L, optSource) {
  function isSyntactic(ruleName) {
    var firstLetter = ruleName.charAt(0).toLowerCase();
    return 'a' <= firstLetter && firstLetter <= 'z';
  }

  // An Ohm semantics for generic syntax highlighting.
  var s = L.grammar && L.grammar.semantics().addOperation('syntaxHighlight', {
    _nonterminal: function(children) {
      var ruleName = this.ctorName;
      var doc = conc.doc;
      doc.markText(
          doc.posFromIndex(this.interval.startIdx),
          doc.posFromIndex(this.interval.endIdx),
          {className: ruleName}
      );

      // Only bother to mark up the first level of lexical rule.
      // (We don't care about the decomposition of a token for syntax highlighting.)
      if (isSyntactic(ruleName) || ruleName === 'keyword' || ruleName === 'space') {
        children.forEach(function(child) { child.syntaxHighlight() });
      }
    }
  });

  function syntaxHighlight(src) {
    var matchResult = L.grammar.match(src);
    if (matchResult.succeeded()) {
      s(matchResult).syntaxHighlight();
      s(matchResult.getDiscardedSpaces()).syntaxHighlight();
    } else {
      // The input didn't parse, but we can at least highlight tokens individually.
      matchResult = L.grammar.match(src, 'tokens');
      s(matchResult).syntaxHighlight();
    }
  }

  var playground = toDOM(['table']);
  playground.className = 'playground';

  var scripts = document.getElementsByTagName('script');
  var thisScriptTag = scripts[scripts.length - 1];
  thisScriptTag.parentNode.appendChild(playground);

  function addEditor(label, width, height, optReadOnly) {
    var editorTd = toDOM(['td']);
    var labelTd = toDOM(['td', label]);
    var editorTr = toDOM(['tr', labelTd, editorTd]);
    var collapsed = false;
    labelTd.onclick = function() {
      $(editorTr).toggleClass('collapsed');
      editor.refresh();
    };
    playground.appendChild(editorTr);
    var editor = CodeMirror(editorTd, {
      readOnly: optReadOnly,
      value: '',
      mode: 'text/plain',
      enterMode: 'flat',
      electricChars: false,
      lineNumbers: true,
      smartIndent: false,
      lineSpacing: 1.1
    });
    editor.setSize(width, height);
    return editor;
  }

  var conc = addEditor('concrete syntax', 630, 300);
  var abs = L.grammar ? addEditor('abstract syntax', 630, 200, true) : undefined;
  var trans = L.transAST ? addEditor('translation', 630, 200, true) : undefined;
  var res = addEditor('result', 630, 100, true);

  function clearEverythingElse() {
    if (abs) {
      abs.setValue('');
    }
    if (trans) {
      trans.setValue('');
    }
    res.setValue('');
  }
    
  conc.on('change', function() { haveSource(conc.getValue()); });
  if (optSource) {
    conc.setValue(optSource);
  }

  var parseErrorWidget;
  function haveSource(src) {
    if (parseErrorWidget) {
      conc.removeLineWidget(parseErrorWidget);
      parseErrorWidget = undefined;
    }
    conc.getAllMarks().forEach(function(mark) { mark.clear(); });

    if (src.trim().length === 0) {
      clearEverythingElse();
      return;
    }

    if (!L.grammar) {
      callAndShowResult(function() { return JS.eval(src); });
      return;
    }

    syntaxHighlight(src);
    var matchResult = L.grammar.match(src);
    if (matchResult.succeeded()) {
      var ast = L.semanticsForParsing(matchResult).toAST();
      haveAST(ast);
    } else {
      showSyntaxError(matchResult, src);
    }
  }

  function haveAST(ast) {
    abs.setValue(L.prettyPrintAST(ast));
    if (L.transAST) {
      try {
        var code = L.transAST(ast);
        trans.setValue(prettyPrintJS(code));
        callAndShowResult(function() { return JS.eval(code); });
      } catch (e) {
        trans.setValue(showException(e));
        return;
      }
    } else {
      callAndShowResult(function() { return L.evalAST(ast); });
    }
  }

  function callAndShowResult(thunk) {
    try {
      haveResult(thunk());
    } catch (e) {
      res.setValue(showException(e));
    }
  }

  function haveResult(value) {
    res.setValue(L.prettyPrintValue(value));
  }

  function showSyntaxError(matchResult, src) {
    setTimeout(
      function() {
        if (conc.getValue() === src && !parseErrorWidget) {
          function repeat(x, n) {
            var xs = [];
            while (n-- > 0) {
              xs.push(x);
            }
            return xs.join('');
          }
          var msg = 'Expected: ' + matchResult.getExpectedText();
          var pos = conc.doc.posFromIndex(matchResult.getRightmostFailurePosition());
          var error = toDOM(['parseError', repeat(' ', pos.ch) + '^\n' + msg]);
          parseErrorWidget = conc.addLineWidget(pos.line, error);
          $(error).hide().slideDown();
        }
      },
      2500
    );
  }

  function showException(e) {
    return e.hasOwnProperty('stack') ?
        e.stack :
       'Uncaught exception: ' + e.toString();
  }
}

// insertPlayground('6 * 7')

