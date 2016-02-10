// This file contains the ast for holding the matchers files.
"use strict";

var ast = {};

function addMethod(name, cls) {
  Object.getOwnPropertyNames(cls.prototype).forEach(fname => {
    if (fname === "constructor") return;
    ast[fname].prototype[name] = cls.prototype[fname];
  });
}

ast.addMethod = addMethod;

ast.AST = class AST extends Object{ 
  constructor() {
    super(); 
  }
}
var AST = ast.AST;

ast.MatchObject = class MatchObject extends AST { 
  constructor(args, clauses) {
    super();
    this.args = args;
    this.clauses = clauses;
  }
}

ast.Clause = class Clause extends AST { 
  constructor(pattern, doBlock) {
    super();
    this.pattern = pattern;
    this.doBlock = doBlock;
  }
}

var Pattern = ast.Pattern = class Pattern extends AST{ 
  constructor() {
    super();
  }
}

ast.ValuePattern = class ValuePattern extends Pattern { 
  constructor(value) {
    super();
    this.value = value;
  }
}

ast.VariablePattern = class VariablePattern extends Pattern { 
  constructor(name) {
    super();
    this.name = name;
  }
}

ast.WildcardPattern = class WildcardPattern extends Pattern { 
  constructor() {
    super();
  }
}

ast.ArrayPattern = class ArrayPattern extends Pattern { 
  constructor(subpatterns, restpattern) {
    super();
    this.subpatterns = subpatterns;
    this.restpattern = restpattern;
  }
}

module.exports = ast;
