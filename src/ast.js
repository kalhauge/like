// This file contains the ast for holding the matchers files.
"use strict";

var ast = {};

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

ast.DatumPattern = class DatumPattern extends Pattern { 
  constructor(name, args) {
    super();
    this.name = name;
    this.args = args;
  }
}

ast.ObjectPattern = class ObjectPattern extends Pattern { 
  constructor(attrs) {
		super();
		this.attrs = attrs;
  }
}

ast.AttrPattern = class AttrPattern extends Pattern { 
  constructor(key, pattern) {
		super();
		this.key = key;
		this.pattern = pattern;
  }
}

module.exports = ast;
