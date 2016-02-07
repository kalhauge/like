// This file contains the ast for holding the matchers files.

class AST { 
  constructor() { }
}

class MatchObject extends AST { 
  constructor(matchArgs, clauses) {
    super();
    this.matchArgs = matchArgs;
    this.clauses = clauses;
  }
}

class Clause extends AST { 
  constructor(pattern, doBlock) {
		super();
		this.pattern = pattern;
		this.doBlock = doBlock;
  }
}

class Pattern { 
  constructor() {
  }
}

class ValuePattern extends Pattern { 
  constructor(value) {
		super();
		this.value = value;
  }
}

class VariablePattern extends Pattern { 
  constructor(name) {
		super();
		this.name = name;
  }
}

class ArrayPattern extends Pattern { 
  constructor(subpatterns) {
		super();
		this.subpatterns = subpatterns;
  }
}

