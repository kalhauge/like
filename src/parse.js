"use strict"

var ohm = require("ohm-js");
var ast = require("./ast.js");
var like_ohm = require("../gen/like.ohm.js");
var _ = require("lodash");

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
  MatchObject: (args, _arw, content) => new ast.MatchObject(args.toAST(), content.toAST()),
  Args_many: (_lp, variables, _rp)   => variables.toAST(),

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

  number: function (numbers, s, numbers2) { return parseFloat(this.interval.contents)},

  DoBlock: function (code) { return this.interval.contents.replace(/^\s+|\s+$/g, '') },
  ident: function (l, s) { return this.interval.contents },

  string: function (_a, _b, _c) { return JSON.parse(this.interval.contents)},

  // EmptyListOf: () => [],
});

module.exports = parse
