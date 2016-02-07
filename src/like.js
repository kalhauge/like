
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

  number: function (numbers, s, numbers2) { console.log(this.interval.contents); return parseFloat(this.interval.contents)},

  DoBlock: function (code) { return this.interval.contents.replace(/^\s+|\s+$/g, '') },
  ident: function (l, s) { return this.interval.contents },

  string: function (_a, _b, _c) { return JSON.parse(this.interval.contents)},

  // EmptyListOf: () => [],
});



