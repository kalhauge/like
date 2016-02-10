"use strict";

var ast = require('./ast.js');

// A match tree has {}

// Create a method, that calculates a match tree. 
ast.addMethod('matchtree', class {
  MatchObject() { 
    var args = this.args;
    return this.clauses.map(c => c.matchtree(args)).reduce((a, b) => {
       return { first: a, then: b};
    })
  }

});
