"use strict";

exports.parse = require('./parse.js')
exports.translate = require('./translate')
exports.ast = require('./ast.js')
exports.matchtree = require('./matchtree.js')

exports.compile = function (fn) { 
  var rec, ast = exports.parse(fn);
  var js = exports.translate(ast);
  return eval("rec = " + js);
}
