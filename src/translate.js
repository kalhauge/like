"use strict";

var ast = require("./ast.js");
var _ = require("lodash");
var utils = require('./utils.js');
var matchtree = require("./matchtree.js");

function translate(ast) {
  var tree = matchtree.toMatchTree(ast); 
  return "function (" +  ast.args + ") {\n" + 
      transMT(tree, "  ") + 
  "}";
}

var transMT = utils.createMethod(matchtree.tree, class {

  OR (indent) {
    return transMT(this.first, indent) + transMT(this.then, indent);
  }
  
  AND (indent) { 
    return indent + "if (" + transMT(this.first, "") + ") {\n" + 
           transMT(this.then, indent + "  ") + 
           indent + "}\n" 
  }
  
  EQ (indent) { 
    return indent + this.target +  " === " +  this.should; 
  }
  
  LET (indent) { 
    return indent + "let " + this.name + " = " + this.is + ";\n" + 
          transMT(this.in_, indent); 
  }

  INSTOF (indent) {
    return indent + this.value + " instanceof " + this.type
  }
  
  GTE (indent) {
    return indent + this.should + " >= " + this.target
  }

  ALL (indent) {
    return indent + "let " + this.free.map(x => "_" + x + " = []") + ";\n" +
      indent + this.array + ".forEach(_like_it1 => {\n" + 
        transMT(this.all, indent + "  ") + 
      indent + "});\n" +
      indent + "let " + this.free.map(x => x + " = _" + x) + ";\n" +
      transMT(this.in_, indent);
  }

  UPDATE (indent) {
    return indent + "_" + this.update + ".push(" + this.update + ");\n";
  }

  OUTPUT (indent) { 
    return indent + "return " + this.expr + ";\n"
  }
});

module.exports = translate;

var trans = utils.createMethod(ast, class {
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
