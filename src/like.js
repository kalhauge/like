
function compile(fn) {
  var rec, str = transform(fn)
  console.log(str)
  return eval("rec = " + str)
}

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
    return indent + "function (" + this.args + ") {\n" + 
      (_.isEmpty(freeVars) ? "" : indent + "  var " + freeVars + ";\n") + 
      this.clauses.map(c => c.trans(indent + "  ", this.args)).join("") + 
    indent + "}"
  }

  Clause (indent, args) {
    if (this.pattern.length > args.length) throw "Expected at least " + this.pattern.length + " arguements, but got " + args.length;
    return indent + "if ( " + this.pattern.map((p,i) => "(" + p.trans("", args[i]) + ")").join(" && ") + " ) {\n" + 
      indent + "  return " + this.doBlock + ";\n" + 
      indent + "}\n" ;
  }

  ValuePattern(indent, value) { 
    return value + " === " + this.value.toString()
  }

  VariablePattern(indent, value) {
    return this.name + " = " + value + " || true";
  }

  WildcardPattern(indent, value) {
    return "true";
  }

  ArrayPattern(indent, value) { 
    var clauses = [ 
      value + " instanceof Array",
      value + ".length " + ( this.restpattern ? ">= " : "=== ")  + this.subpatterns.length
    ] 
    this.subpatterns.forEach((p, i) => {
      clauses.push("(" + p.trans(indent, value + "[" + i + "]") + ")") 
    });
    if ( this.restpattern ) { 
      clauses.push("(" + this.restpattern.trans(
              indent, 
              value + ".splice(" + this.subpatterns.length + ")") + 
          ")") 
    }
    return clauses.join(" && ");
  }
});

addMethod("free", class { 
  MatchObject () { return _.uniq(_.flatten(this.clauses.map(c => c.free()))) }
  Clause () { return _.flatten(this.pattern.map(p => p.free())) }
  ValuePattern () { return [] }
  VariablePattern () { return [this.name] }
  ArrayPattern () { 
    var freeVars = this.subpatterns.map(p => p.free());
    if ( this.restpattern) { 
      freeVars.push(this.restpattern.free())
    }
    return _.flatten(freeVars);
  }
  WildcardPattern () { return [] }
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
  WildcardPattern: (_us) => new WildcardPattern(),
  VariablePattern: ident => new VariablePattern(ident.toAST()),
  ArrayPattern: (_ob, subpatterns, _c, _dots, rest, _cb) => {
    var restpattern = rest.toAST();
    return new ArrayPattern(subpatterns.toAST(), _.isEmpty(restpattern) ? null : restpattern[0])
  },

  number: function (numbers, s, numbers2) { return parseFloat(this.interval.contents)},

  DoBlock: function (code) { return this.interval.contents.replace(/^\s+|\s+$/g, '') },
  ident: function (l, s) { return this.interval.contents },

  string: function (_a, _b, _c) { return JSON.parse(this.interval.contents)},

  // EmptyListOf: () => [],
});



