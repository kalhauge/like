// This file contains the ast for holding the matchers files.
"use strict";

function addMethod(name, cls) {
  Object.getOwnPropertyNames(cls.prototype).forEach(fname => {
    if (name === "constructor") return;
    exports[fname].prototype[name] = cls.prototype[fname];
  });
}

exports.addMethod = addMethod;

var AST = exports.AST = class AST { 
  constructor() { }
}

exports.MatchObject = class MatchObject extends AST { 
  constructor(args, clauses) {
    super();
    this.args = args;
    this.clauses = clauses;
  }
}

exports.Clause = class Clause extends AST { 
  constructor(pattern, doBlock) {
    super();
    this.pattern = pattern;
    this.doBlock = doBlock;
  }
}

var Pattern = exports.Pattern = class Pattern extends AST{ 
  constructor() {
    super();
  }
}

exports.ValuePattern = class ValuePattern extends Pattern { 
  constructor(value) {
    super();
    this.value = value;
  }
}

exports.VariablePattern = class VariablePattern extends Pattern { 
  constructor(name) {
    super();
    this.name = name;
  }
}

exports.WildcardPattern = class WildcardPattern extends Pattern { 
  constructor() {
    super();
  }
}

exports.ArrayPattern = class ArrayPattern extends Pattern { 
  constructor(subpatterns, restpattern) {
    super();
    this.subpatterns = subpatterns;
    this.restpattern = restpattern;
  }
}
