"use strict";

var ast = require('./ast.js');
var _ = require('lodash');
var utils = require('./utils.js');

// A match tree has {}
var tree = {
  AND: function AND (first, then) {
    this.first = first;
    this.then = then;
  },

  OR: function OR (first, then) {
    this.first = first;
    this.then = then;
  },

  EQ: function EQ (should, target) {
    this.should = should;
    this.target = target;
  },
  
  NEQ: function NEQ (should, target) {
    this.should = should;
    this.target = target;
  },

  LTE: function LTE (should, target) {
    this.should = should;
    this.target = target;
  },

  GTE: function GTE (should, target) {
    this.should = should;
    this.target = target;
  },

  LET: function LET (env, in_) {
    this.env = env;
    this.in_ = in_;
  },

  UPDATE: function UPDATE (update) {
    this.update = update;
  },

  ALL: function ALL (array, free, all, in_) {
    this.array = array;
    this.free = free;
    this.all = all;
    this.in_ = in_;
  },

  INSTOF: function INSTOF (value, type) {
    this.value = value;
    this.type = type;
  },

  OUTPUT: function OUTPUT (expr) {
    this.expr = expr;
  },
}
exports.tree = tree

function and (first, then) { return new tree.AND([first], then) }
function or (first, then) { return new tree.OR(first, then) }


// Create a method, that calculates a match tree. 
var toMatchTree = exports.toMatchTree = utils.createMethod(ast, class {
  
  MatchObject () { 
    var args = this.args;
    return this.clauses.map(c => toMatchTree(c, args)).reduce(or)
  }

  Clause (args) { 
    let len = this.pattern.length;
    return this.pattern.reverse().reduce(
        (acl, p, i) => toMatchTree(p, args[len - i - 1] || "arguments[" + (len - i - 1) + "]", acl),
        new tree.OUTPUT(this.doBlock)
        )
  }

  ValuePattern (arg, next) {
    return and(new tree.EQ(JSON.stringify(this.value), arg), next);
  }

  WildcardPattern (arg, next) {
    return next;
  }

  VariablePattern (arg, next) {
    var env = {}; env[this.name] = arg;
    return new tree.AND(
      [new tree.NEQ(undefined, arg)],
      new tree.LET(env, next)
    );
  }

  DatumPattern (arg, next) { 
    let len = this.args.length;
    return new tree.AND([
        new tree.INSTOF(arg, "Object"),
        new tree.EQ("\"" + this.name + "\"", arg + ".constructor.name"),
        new tree.EQ(this.args.length, arg + ".constructor.length")
    ], 
    new tree.LET(
      {_args: "_arguments(" + arg + ")"}, 
      this.args.reverse().reduce(
        (acl, p, i) => toMatchTree(p, "_args[" + (len - i - 1) +"]", acl),
        next
        )
      )
    );
  }

  ArrayPattern (arg, next) {
    var sub = next;
    let len = this.subpatterns.length;
    var logic;
    
    if (this.restpattern) {
      let freevars = free(this.restpattern);
      logic = ( len > 0 ?  
        [new tree.GTE(arg + ".length", this.subpatterns.length)] : []
      )
      sub = new tree.ALL( 
        len > 0 ? arg + ".slice(" + len + ")" : arg,
        freevars,
        toMatchTree(
          this.restpattern,
          "_e", 
          new tree.UPDATE(freevars)
        ),
        sub
      );
    } else {
      logic = [new tree.EQ(arg + ".length", this.subpatterns.length)]
    }

    sub = this.subpatterns.reverse().reduce(
        (acl, p, i) => toMatchTree(p, arg + "[" + (len - i - 1) +"]", acl),
        sub
    );
    return new tree.AND([new tree.INSTOF(arg, "Array")].concat(logic), sub)
  }

  ObjectPattern (arg, next) { 
    let len = this.attrs.length;
    return this.attrs.reverse().reduce(
        (acl, p, i) => toMatchTree(p, arg, acl),
        next
    )
  }

  AttrPattern (arg, next) {
    return toMatchTree(this.pattern, arg + "[\"" + this.key + "\"]", next)
  }

}, "translate");

var free = utils.createMethod(ast, class { 
  MatchObject () { return _.uniq(_.flatten(this.clauses.map(c => c.free()))) }
  Clause () { return _.flatten(this.pattern.map(free)) }
  ValuePattern () { return [] }
  VariablePattern () { return [this.name] }
  ArrayPattern () { 
    var freeVars = this.subpatterns.map(free);
    if ( this.restpattern) { 
      freeVars.push(free(this.restpattern))
    }
    return _.flatten(freeVars);
  }
  WildcardPattern () { return [] }
  AST() { throw this.constructor.name + " has no free" }
  ObjectPattern ()  { return _.flatten(this.attrs.map(free)) }
  AttrPattern () { return free(this.pattern) }
  DatumPattern () { return _.flatten(this.args.map(free)) }
}, "free");



