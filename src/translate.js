"use strict";

var ast = require("./ast.js");
var _ = require("lodash");

function translate(ast) {
  return ast.trans("");
}

ast.addMethod("trans", class {
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
      clauses.push("(" + 
          this.restpattern.trans(
            indent, 
            value + ".splice(" + this.subpatterns.length + ")"
            ) + 
          ")") 
    }
    return clauses.join(" && ");
  }
});

ast.addMethod("free", class { 
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

module.exports = translate;
