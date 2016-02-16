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

exports.compile = function (fn) { 
  var rec, ast = exports.parse(fn);
  var js = exports.translate(ast);

  var _arguments = function (a) {
    let pnames = getParameterNames(a.constructor) 
    return pnames.map(p => a[p]);
  }

  return eval("rec = " + js);
}
