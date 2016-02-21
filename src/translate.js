"use strict";

var ast = require("./ast.js");
var _ = require("lodash");
var utils = require('./utils.js');
var matchtree = require("./matchtree.js");

function translate(ast) {
  var tree = optimize(matchtree.toMatchTree(ast)); 
  return "function (" +  ast.args + ") {\n" + 
      "  " + (ast.publicvars.length !== 0 ? "var pv = fn(), " +
          ast.publicvars.map((v, i) => v + " = pv[" + i + "]").join(", ") + "\n" : "") + 
      transMT(tree, "  ") + 
      "  throw 'MatchFailure: could not match ' + " + ast.args.join(" + ', ' + ") + "\n" + 
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
    var inner = 
      indent + "if (" + this.array + ".every(_e => {\n" + 
        transMT(this.all, indent + "  ") + 
//      indent + "  return false;\n" + 
      indent + "})) {\n";

    if (_.isEmpty(this.free)) {
      return inner + transMT(this.in_, indent + "  ") + indent + "}\n";
    } else {
      return (
        indent +    "let " + this.free.map(x => "_" + x + " = []").join(", ") + ";\n" +
                    inner +
        indent +   "  let " + this.free.map(x => x + " = _" + x).join(", ") + ";\n" + 
                   transMT(this.in_, indent + "  ") +
        indent +   "}\n";
      )
    }
  }

  UPDATE (indent) {
    return this.update.map(u => 
        indent + "_" + u + ".push(" + u + ");\n"
        ).join("")
      + indent + "return true;\n";
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
