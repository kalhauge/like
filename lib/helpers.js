'use strict';

class AST {
  __equals__(that) {
    if (that instanceof AST && this.constructor === that.constructor) {
      for (var p in this) {
        if (this.hasOwnProperty(p) && !__equals__(this[p], that[p])) {
          return false;
        }
      }
      return true;
    } else {
      return false;
    }
  }
}

function prettyPrintJS(code) {
  if (typeof code === "string") {
    return js_beautify(code);
  } else {
    throw new Error("expected a string, but got " + code + " instead");
  }
} 

function __equals__(x, y) {
  if (x instanceof AST) {
    return x.__equals__(y);
  } else if (x instanceof Array) {
    return __arrayEquals__(x, y);
  } else if (x && typeof x === 'object' && y && typeof y === 'object') {
    return __objEquals__(x, y);
  } else {
    return x === y;
  }
}

function __objEquals__(x, y) {
  for (var k in x) {
    if (!__equals__(x[k], y[k])) {
      return false;
    }
  }
  for (var k in y) {
    if (!(k in x)) {
      return false;
    }
  }
  return true;
}

function __arrayEquals__(xs, ys) {
  if (xs instanceof Array && ys instanceof Array && xs.length === ys.length) {
    for (var idx = 0; idx < xs.length; idx++) {
      var x = xs[idx];
      var y = ys[idx];
      if (!(__equals__(x, y))) {
        return false;
      }
    }
    return true;
  } else {
    return false;
  }
}

function toDOM(x) {
  if (x instanceof Node) {
    return x;
  } else if (x instanceof Array) {
    var xNode = document.createElement(x[0]);
    x.slice(1).
      map(function(y) { return toDOM(y); }).
      forEach(function(yNode) { xNode.appendChild(yNode); });
    return xNode;
  } else {
    return document.createTextNode(x);
  }
}

