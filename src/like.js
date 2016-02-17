"use strict";

var _ = require("lodash");

exports.parse = require('./parse.js')
exports.translate = require('./translate')
exports.ast = require('./ast.js')
exports.matchtree = require('./matchtree.js')

function getParameterNames(fn) {
  var code = fn.toString()
  var result = code.match(/\(([^)]*)\)/)[1].match(/([^\s,]+)/g);
  return result === null ? [] : result;
}
exports.pprint = function (ast)  {
  var js = exports.translate(ast);
  var str = (
      "_arguments = function (a) {\n" + 
      "  let pnames = getParameterNames(a.constructor)\n" +
      "  return pnames.map(p => a[p]);\n" +
      "}\n" +
      "rec = " + js
  )
  return str;
}
exports.compile = function (fn) { 
  var ast = exports.parse.parse(fn);
  var rec = null, _arguments = null;
  return eval(exports.pprint(ast));
}
