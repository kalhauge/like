
function transform(fn) {
  return parse(fn).trans("");
}

function addMethod(name, cls) {
  Object.getOwnPropertyNames(cls.prototype).forEach(fname => {
    if (name === "constructor") return;
    eval(fname).prototype[name] = cls.prototype[fname];
  });
}

addMethod("trans", class {
  AST (indent) { 
    throw (this.constructor.name + " not defined for trans")
  }

  MatchObject (indent) { 
    var freeVars = this.free();
    console.log(freeVars);
    return indent + "function (" + this.args + ") {\n" + 
      (_.isEmpty(freeVars) ? "" : indent + "  var " + freeVars + ";\n") + 
      this.clauses.map(c => c.trans(indent + "  ", this.args)).join("") + 
    indent + "}"
  }

  Clause (indent, args) {
    return indent + "if ( " + this.pattern.trans("", args[0]) + " ) {\n" + 
      indent + "  return " + this.doBlock + ";\n" + 
      indent + "}\n" ;
  }

  ValuePattern(indent, value) { 
    return value + " === " + this.value.toString()
  }

  VariablePattern(indent, value) {
    return this.name + " = " + value + " || true";
  }

  ArrayPattern(indent, value) { 
    var clauses = [ 
      value + " instanceof Array",
      value + ".length === " + this.subpatterns.length
    ] 
    this.subpatterns.forEach((p, i) => {
      clauses.push("(" + p.trans(indent, value + "[" + i + "]") + ")") 
    });
    return clauses.join(" && ");
  }
});

addMethod("free", class { 
  MatchObject () { return _.uniq(_.flatten(this.clauses.map(c => c.free()))) }
  Clause () { return this.pattern.free() }
  ValuePattern () { return [] }
  VariablePattern () { return [this.name] }
  ArrayPattern () { return _.flatten(this.subpatterns.map(p => p.free()))}
  AST() { throw this.constructor.name + " has no free" }
});

function parse(fn) {
  var string = fn.toString();
  var match = g.match(string);
  if (match.failed()) {
    throw match.message
  }
  return sematics(match).toAST();
}

var g = ohm.grammar(like_ohm);
var sematics = g.semantics().addOperation("toAST", { 
  MatchObject: (args, _arw, content) => new MatchObject(args.toAST(), content.toAST()),
  Args_many: (_lp, variables, _rp)   => variables.toAST(),
  
  ListOf_some: (m, _c1, ms) => [m.toAST()].concat(ms.toAST()),
  ListOf_none: () => [],
  Content: (_lc, cs, _lr) => cs.toAST(),

  Clause: (pattern, _arw, doBlock) => new Clause(pattern.toAST(), doBlock.toAST()),

  ValuePattern: (x) => new ValuePattern(x.toAST()),
  VariablePattern: ident => new VariablePattern(ident.toAST()),
  ArrayPattern: (_ob, subpatterns ,_cb) => new ArrayPattern(subpatterns.toAST()),

  ArrayInternal_rest: (_dots, pattern) => new RestArrayPattern(pattern.toAST()),

  number: function (numbers, s, numbers2) { return parseFloat(this.interval.contents)},

  DoBlock: function (code) { return this.interval.contents.replace(/^\s+|\s+$/g, '') },
  ident: function (l, s) { return this.interval.contents },

  string: function (_a, _b, _c) { return JSON.parse(this.interval.contents)},

  // EmptyListOf: () => [],
});



