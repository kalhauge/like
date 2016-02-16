
function createMethod(functions, cls, name) {
  var dict = {}
  Object.getOwnPropertyNames(cls.prototype).forEach(fname => {
    if (fname === "constructor") return;
    if (fname in functions) {
      dict[functions[fname]] = cls.prototype[fname];
    } else { 
      throw "Don't know " + fname;
    }
  });
  return function (node, ...args) { 
    if (node.constructor in dict) 
      return dict[node.constructor].apply(node, args)
    else
      name = name || "Unnamed function"
      throw name + " not defined for " + node.constructor.name + "."
  }
}
exports.createMethod = createMethod;
