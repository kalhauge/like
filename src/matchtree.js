"use strict";

var ast = require('./ast.js');
var _ = require('lodash');

// A match tree has {}

function AND (first, then) {
	this.first = first;
	this.then = then;
}

function OR (first, then) {
	this.first = first;
	this.then = then;
}

function EQ (should, target) {
  this.should = should;
  this.target = target;
}

function LTE (should, target) {
  this.should = should;
  this.target = target;
}

function GTE (should, target) {
  this.should = should;
  this.target = target;
}

function LET (name, is, in_) {
	this.name = name;
	this.is = is;
	this.in_ = in_;
}

function UPDATE (update) {
  this.update = update;
}

function ALL (array, free, all, in_) {
  this.array = array;
	this.free = free;
	this.all = all;
	this.in_ = in_;
}

function INSTOF (value, type) {
	this.value = value;
	this.type = type;
}

function OUTPUT (expr) {
	this.expr = expr;
}

function and (first, then) { return new AND(first, then) }
function or (first, then) { return new OR(first, then) }

// Create a method, that calculates a match tree. 
ast.addMethod('matchtree', class {
  
  MatchObject () { 
    var args = this.args;
    return this.clauses.map(c => c.matchtree(args)).reduce(or)
  }

  Clause (args) { 
    let len = this.pattern.length;
    return this.pattern.reverse().reduce(
        (acl, p, i) => p.matchtree(args[len - i - 1], acl),
        new OUTPUT(this.doBlock)
        )
  }

  ValuePattern (arg, next) {
    return and(new EQ(this.value, arg), next);
  }

  WildcardPattern (arg, next) {
    return next;
  }

  VariablePattern (arg, next) {
    return new LET(this.name, arg, next);
  }

  ArrayPattern (arg, next) {
    var length = "_like1"
    var restit = "_like_it1"
    var sub = next;
    let len = this.subpatterns.length;
    
    if (this.restpattern) {
      let freevars = this.restpattern.free();
      sub = new ALL( 
        arg + ".slice(" + len + ")",
        freevars,
        this.restpattern.matchtree(
          restit, 
          new UPDATE(freevars)
        ),
        sub
      );
    } 

    sub = this.subpatterns.reverse().reduce(
        (acl, p, i) => p.matchtree(arg + "[" + (len - i - 1) +"]", acl),
        sub
    );
    return and(
        new INSTOF(arg, "Array"),
        new LET(length, arg + ".length", 
          and(
            new GTE(length, this.subpatterns.length),
            sub
          )
        )
    )
  }

});
