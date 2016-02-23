"use strict"

var ohm = require("ohm-js");
var ast = require("./ast.js");
var langs = require("../gen/langs.js");
var _ = require("lodash");

function parse(fn) {
  var string = fn.toString();
  var match = g.match(string);
  if (match.failed()) {
    throw match.message
  }
  return semantics(match).toAST();
}

var es5 = ohm.grammar(langs.es5)
var g = ohm.grammar(langs.like, {ES5: es5});

var semantics = g.semantics().addOperation("toAST", { 
  Program: a => a.toAST(),
  MatchObject: (args, _arw, pubvars, _sep, content) => {
    let pv = pubvars.toAST();
    if (pv.length > 0) pv = pv[0];
    return new ast.MatchObject(args.toAST(), pv, content.toAST())
  },
  Args_one : (variable) => [variable.toAST()],
  Args_many: (_lp, variables, _rp) => variables.toAST(),

  PublicVars: (_lp, variables, _rp) => variables.toAST(),

  ListOf_some: (m, _c1, ms) => [m.toAST()].concat(ms.toAST()),
  ListOf_none: () => [],
  Content: (_lc, cs, _lr) => cs.toAST(),

  Clause: (pattern, _arw, doBlock) => new ast.Clause(pattern.toAST(), doBlock.toAST()),

  Pattern_paran: (_lp, x, _rp) => x.toAST(),
  ValuePattern: (x) => new ast.ValuePattern(x.toAST()),
  WildcardPattern: (_us) => new ast.WildcardPattern(),
  VariablePattern: ident => new ast.VariablePattern(ident.toAST()),
  
  ArrayPattern_concrete: (_ob, subpatterns, _c, _dots, rest, _cb) => {
    var restpattern = rest.toAST();
    return new ast.ArrayPattern(subpatterns.toAST(), _.isEmpty(restpattern) ? null : restpattern[0])
  },
  ArrayPattern_many: (_ob, _dots, rest, _cb) => {
    var restpattern = rest.toAST();
    return new ast.ArrayPattern([], restpattern)
  },

  ObjectPattern: (_op, attrs, _cp) => new ast.ObjectPattern(attrs.toAST()),
  
  AttrPattern: (key, _c, pattern) => {
    return new ast.AttrPattern(key.toAST(), pattern.toAST());
  },
  
  DatumPattern: (name, _lp, args, _rp) => {
    return new ast.DatumPattern(name.toAST(), args.toAST()) 
  },

  //number: function (numbers, s, numbers2) { return parseFloat(this.interval.contents)},

  DoBlock: function (code) { return this.interval.contents.replace(/^\s+|\s+$/g, '') },
  identifier: function (a) { return this.interval.contents },
  literal: function (_a) { return JSON.parse(this.interval.contents)},
  stringLiteral : function (_a, b, c) { return JSON.parse(this.interval.contents)},

  // EmptyListOf: () => [],
});

module.exports = { 
  parse: parse,
  semantics: semantics,
  grammar: g
};
