'use strict';

class Language {
  constructor(grammar, semanticsForParsing) {
    this.grammar = grammar;
    this.semanticsForParsing = semanticsForParsing;
  }

  parse(str) {
    var matchResult = this.recognize(str);
    if (matchResult.failed()) {
      throw matchResult;
    }
    return this.toAST(matchResult);
  }

  recognize(str) {
    return this.grammar.match(str);
  }

  toAST(matchResult) {
    return this.semanticsForParsing(matchResult).toAST();
  }

  // TODO: Consider providing a better pretty-printer by default.

  static prettyPrintValue(x) {
    if (x === undefined) {
      return 'undefined';
    } else if (typeof x === 'function') {
      return '(' + x.toString() + ')';
    } else if (typeof x === 'number') {
      // This case is required for positive and negative infinity :/
      return '' + x;
    } else {
      return JSON.stringify(x);
    }
  }

  prettyPrintValue(x) {
    return Language.prettyPrintValue(x);
  }
  
  prettyPrintAST(x) {
    return Language.prettyPrintValue(x);
  }
}

const JS = new Language();

JS.parse = undefined;
JS.eval = function(src) {
  return eval('"use strict";\nundefined;\n' + src);
};

