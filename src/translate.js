"use strict";

var ast = require("./ast.js");
var _ = require("lodash");
var utils = require('./utils.js');
var matchtree = require("./matchtree.js");

function translate(ast) {
  var tree = (matchtree.toMatchTree(ast)); 
  return "function (" +  ast.args + ") {\n" + 
      (ast.publicvars.length !== 0 ? "  var pv = fn(), " +
          ast.publicvars.map((v, i) => v + " = pv[" + i + "]").join(", ") + "\n" : "") + 
      transMT(tree, "  ") + 
      ( ast.args.length > 0 ? 
        "  throw 'MatchFailure: could not match ' + "  + 
          ast.args.map(e => "'" + e + " = ' + JSON.stringify(" + e + ")").join(" + ', ' + ") + "\n" 
        : "  throw 'MatchFailure: could not match input';\n"
      ) + 
  "}";
}

var transMTX = utils.createMethod(matchtree.tree, class { 
  EQ () { return this.target +  " === " +  this.should; }
  NEQ () { return this.target +  " !== " +  this.should; }
  INSTOF () { return this.value + " instanceof " + this.type }
  GTE () { return this.should + " >= " + this.target }
});

var transMT = utils.createMethod(matchtree.tree, class {

  OR (indent) {
    return transMT(this.first, indent) + transMT(this.then, indent);
  }
  
  AND (indent) {
    return ( 
        indent + "if (" + this.first.map(transMTX).join(" && ") + ") {\n" + 
        transMT(this.then, indent + "  ") + 
        indent + "}\n" 
    ) 
  }
  
  LET (indent) { 
    return indent + "let " + 
        Object.getOwnPropertyNames(this.env).
          map(n => n + " = " + this.env[n], this).join(", ") +
        ";\n" + transMT(this.in_, indent); 
  }


  ALL (indent) {
    var str = 
      indent + "var _vars = " + this.array + ".map(_e => {\n" + 
        transMT(this.all, indent + "  ") + 
//      indent + "  return false;\n" + 
      indent + "});\n" +
      indent + "if (_vars.every(_e => { return _e })) {\n";
    if (! _.isEmpty(this.free)) {
      str += (
          indent + "  let " + this.free.map(x => x + " = []").join(", ") + ";\n" +
          indent + "  _vars.forEach(_e => {" + this.free.map((x, i) => x + ".push(_e[" + i + "]);").join(" ") + "});\n"
          )
    } 

    return (
        str + 
        transMT(this.in_, indent + "  ") + 
        indent + "}\n"
        )
  }

  UPDATE (indent) {
    return indent + "return [" + this.update.join(", ") +  "];\n";
  }

  OUTPUT (indent) { 
    return indent + "return " + this.expr + ";\n"
  }
});

module.exports = translate;

function sharedPrefix(as, bs) {
  return _.takeWhile(_.zipWith(as,bs, (a, b) => _.isEqual(a, b) ? a : null))
}

var tt = matchtree.tree; 
var optimize = utils.createMethod(matchtree.tree, class {
  OR () { 
    var then = optimize(this.then)
    var first = optimize(this.first)
    if (then instanceof tt.AND && first instanceof tt.AND) { 
      var prefix = sharedPrefix(first.first, then.first);
      var len = prefix.length;
      if (len > 0) {
        var fand = new tt.AND(first.first.slice(len), first.then);
        var tand = new tt.AND(then.first.slice(len), then.then);
        return optimize(new tt.AND(
              prefix, 
              new tt.OR(fand, tand)
          )
        )
      }
    } 
    return new matchtree.tree.OR(first, then)
  }
  AND () {
    var first = this.first;
    var then = optimize(this.then);
    if (_.isEmpty(first)) return then
    else if (then instanceof tt.AND) {
      return optimize(
          new tt.AND([].concat(this.first, then.first), then.then)
          );
    } else { 
      return new tt.AND(first, then);
    }
  }
  ALL () { 
    var all = optimize(this.all);
    var in_ = optimize(this.in_);
    // pure assignment
    if (this.free.length === 1 && all instanceof tt.LET) {
      let env = {}; env[this.free[0]] = "_e";
      if (_.isEqual(all.env, env)) { 
        let env = {}; env[this.free[0]] = this.array; 
        return optimize(new tt.LET(env, in_))
      }
    } else if (this.free.length === 0 && all instanceof tt.UPDATE) { 
      return in_;
    }
    return new tt.ALL(this.array, this.free, all, in_);
  }

  LET () { 
    let in_ = optimize(this.in_);
    //if (in_ instanceof tt.LET) {
    //  return optimize(new tt.LET(_.assign({}, this.env, in_.env), in_.in_));
    //} 
    return new tt.LET(this.env, in_); 
  }
  UPDATE () { return this }
  OUTPUT () { return this } 
});
