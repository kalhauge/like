"use strict";

// var expect = require('chai').expect,
var chai = chai || require('chai')
var like = like || require('../src/like.js')
var _ = _ || require('lodash')

var expect = chai.expect
var compile = like.compile, parse = like.parse, translate = like.translate;
var asts = like.ast;

describe("matchtree", () => {
  it("should match a single args", () => {
    var ast = parse(a => { 
          1.1 >= 0 
    })
    expect(ast.matchtree()).to.deep.equal({ 
      first: {should: 1.1, target: "a"},
      then: { expr: "0" }
    });
  });
  it("should match a wildcard", () => {
    var ast = parse(a => { 
          _ >= 0 
    })
    expect(ast.matchtree()).to.deep.equal({ expr: "0" });
  });
  it("should match multible args", () => {
    var ast = parse((a, b) => { 
          1, 2 >= x
    })
    expect(ast.matchtree()).to.deep.equal({
      first: { should: 1, target: "a" },
      then: { 
        first: { should: 2, target: "b"},
        then: { expr: "x" }
      }
    });
  });
  it("should match a variable", () => {
    var ast = parse(a => { 
          x >= x
    })
    expect(ast.matchtree()).to.deep.equal(
        { name : "x",
          is: "a",
          in_: { expr: "x" }
        }
    );
  });

  describe("using arrays", () => {
    it("should match empty array", () => {
      var ast = parse(a => { 
        [] >= 0 
      });
      expect(ast.matchtree()).to.deep.equal({
        first: { value : "a", type: "Array" },
        then : {
          name: "_like1",
          is: "a.length",
          in_: { 
            first: { should: "_like1", target: 0 },
            then: { expr: "0" }
          }
        }
      });
    });
    it("should match array with subpatterns", () => {
      var ast = parse(a => { 
        [1, x] >= x
      });
      expect(ast.matchtree()).to.deep.equal({
        first: { value : "a", type: "Array" },
        then : {
          name: "_like1",
          is: "a.length",
          in_: { 
            first: { should: "_like1", target: 2 },
            then: {
              first: { should: 1, target: "a[0]"},
              then: { 
                name: "x", 
                is: "a[1]", 
                in_: { expr: "x" }
              }  
            }
          }
        }
      });
    });
    it("should match array with rest", () => {
      var ast = parse(a => { 
        [1, ...xs] >= xs
      });
      expect(ast.matchtree()).to.deep.equal({
        first: { value : "a", type: "Array" },
        then : {
          name: "_like1",
          is: "a.length",
          in_: { 
            first: { should: "_like1", target: 1 },
            then: {
              first: { should: 1, target: "a[0]"},
              then: { 
                free: ["xs"], 
                array: "a.slice(1)",
                all: { 
                  name: "xs",
                  is: "_like_it1",
                  in_: { update: ["xs"] }
                }, 
                in_: { expr: "xs" }
              }  
            }
          }
        }
      });
    });
    it("should match array with advanced rest", () => {
      var ast = parse(a => { 
        [1, ...xs] >= xs
      });
      expect(ast.matchtree()).to.deep.equal({
        first: { value : "a", type: "Array" },
        then : {
          name: "_like1",
          is: "a.length",
          in_: { 
            first: { should: "_like1", target: 1 },
            then: {
              first: { should: 1, target: "a[0]"},
              then: { 
                array: "a.slice(1)",
                free: ["xs"], 
                all: { 
                  name: "xs",
                  is: "_like_it1",
                  in_: { update: ["xs"] }
                }, 
                in_: { expr: "xs" }
              }  
            }
          }
        }
      });
    });
  });
});

describe("compile", () => {

  it("can make a fib series", () => {
    var fib_ = compile((a, fib) => {
        0 >= 1 
      | 1 >= 1
      | n >= fib(n - 1) + fib(n - 2)
    });
    function fib (n) { return fib_(n, fib); }
    expect(fib(2)).to.equal(2);
    expect(fib(3)).to.equal(3);
    expect(fib(4)).to.equal(5);
  });
  it("can use recursive calls", () => {
    var fib = compile(a => {
        0 >= 1 
      | 1 >= 1
      | n >= rec(n - 1) + rec(n - 2)
    });
    expect(fib(2)).to.equal(2);
    expect(fib(3)).to.equal(3);
    expect(fib(4)).to.equal(5);
  });
  it("can do zip of lists", () => {
    var zip = compile((a, b, _) => {
        [x, ...xs], [y, ...ys] >= _.concat([[x,y]], rec(xs, ys, _))
      | []        , _          >= []
      | _         , []         >= []
    });
    expect(zip([1,2], [3, 4], _)).to.eql([[1,3], [2,4]]);
    expect(zip([1], [3, 4], _)).to.eql([[1,3]]);
    expect(zip([1, 2], [3], _)).to.eql([[1,3]]);
  });
  // it("do match on many twoes", () => {
  //   var twoes = compile(a => {
  //       [...2] >= true
  //     | _      >= false
  //   });
  //   expect(twoes([2, 2, 2])).to.equal(true, twoes.toString());
  //   expect(twoes([2, 1, 2])).to.equal(false, twoes.toString());
  // });
  // 
  // it("do match on first 1 and then 2s", () => {
  //   var twoes = compile(a => {
  //      [1, ...2] >= true
  //     | _        >= false
  //   });
  //   expect(twoes([2, 2, 2])).to.equal(true);
  //   expect(twoes([2, 1, 2])).to.equal(false);
  // });
  // 
  // it("do match recusive many arrays", () => {
  //   var transpose = compile(a => {
  //       [...[xs, ys]] >= [xs, ys]
  //   });
  //   expect(transpose([[1,2], [1, 2], [1, 2]])).to.eql([[1,1,1], [2,2,2]]);
  // });

});

function trans (fn) { 
  return translate(parse(fn))
}

describe("translate", () => {
  
  it("should match the wildcard", () => {
    var str = trans((a) => { _ >= 0 } )

var x = function (a) {
  if ( (true) ) {
    return 0;
  }
}
    expect(str).to.equal(x.toString());
  });

  it("should return a readable function", () => {
    var str = trans((a) => { 1 >= 0 } )

var x = function (a) {
  if ( (a === 1) ) {
    return 0;
  }
}
    expect(str).to.equal(x.toString());
  });
  
  it("should accept multible clauses", () => {
    var str = trans((a) => { 
        1 >= 0 
      | 2 >= 2
    } )

var x = function (a) {
  if ( (a === 1) ) {
    return 0;
  }
  if ( (a === 2) ) {
    return 2;
  }
}
    expect(str).to.equal(x.toString());
  });

  it("should manage vaiables", () => {
    var str = trans((a) => { 
        x >= x + 2
    } )

var x = function (a) {
  var x;
  if ( (x = a || true) ) {
    return x + 2;
  }
}
    expect(str).to.have.string(x.toString());
  });

  it("should match recursively", () => {
var x = function (a) {
  var x,y;
  if ( (a instanceof Array && a.length === 2 && (x = a[0] || true) && (y = a[1] || true)) ) {
    return x + y;
  }
}
    var str = trans((a) => { 
        [x, y] >= x + y
    } )
    expect(str).to.have.equal(x.toString());
  });
  
  it("should match rest", () => {
var x = function (a) {
  var x,xs;
  if ( (a instanceof Array && a.length >= 1 && (x = a[0] || true) && (xs = a.splice(1) || true)) ) {
    return xs;
  }
}
    var str = trans((a) => { 
        [x, ...xs] >= xs
    })
    expect(str).to.have.equal(x.toString());
  });

  it("should match multi-patterns", () => {
var x = function (a,b) {
  var x,y;
  if ( (x = a || true) && (y = b || true) ) {
    return x + y;
  }
}    
    var str = trans((a, b) => { 
        x, y >= x + y
    })
    expect(str).to.have.equal(x.toString());
    
  });
});

describe("parse", () => {
  it("should parse a simple match", () => {
    var ast = parse((a) => {
      10 >= 2
    });
    expect(ast).to.be.an.instanceof(asts.MatchObject);
    expect(ast).to.have.property("args").eql(["a"])
    expect(ast).to.have.property("clauses").with.length(1)

    expect(ast).to.have.property("clauses")
      .with.deep.property("[0]")
        .that.is.a.instanceof(asts.Clause)
    
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.is.a.instanceof(asts.ValuePattern);
    
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("value", 10);

    expect(ast.clauses[0]).to.have.property("doBlock", "2");
  });
  
  it("should parse a float match", () => {
    var ast = parse((a) => { 1.1 >= 0 })
    
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("value", 1.1);
  });
  
  it("should parse multible arguments", () => {
    var ast = parse((a, b) => { 
        1.1 >= 0 
      | x >= 1
    })
    expect(ast.args).to.have.length(2);
  });

  it("should parse a multible patterns", () => {
    var ast = parse((a) => { 
        1.1 >= 0 
      | x >= 1
    })
    
    expect(ast.clauses).to.have.length(2);
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("value", 1.1);
  });

  it("should parse multi-patterns", () => {
    var ast = parse((a, b) => { 
        1.1, 1 >= 0 
      | 0, 1 >= 1
    })
    
    expect(ast.clauses[0]).to.have.property("pattern")
      .that.has.length(2);
  });

  it("should parse a string match", () => {
    var ast = parse((a) => { "some_string" >= 0 })
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("value", "some_string");
  });
  
  it("should parse a wildcard", () => {
    var ast = parse((a) => { _ >= 0 })
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.is.an.instanceof(asts.WildcardPattern)
  });
  
  it("should parse a string match with escapes", () => {
    var ast = parse((a) => { "some\n\"ng" >= 0 })
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("value", "some\n\"ng");
  });

  it("should parse a variable", () => {
    var ast = parse((a) => { x >= x })
    
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.is.a.instanceof(asts.VariablePattern);
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("name", "x");
  });

  describe("using an array", () => {
    it("should parse the empty array", () => {
      var ast = parse((a) => { [] >= x })
    
      expect(ast.clauses[0].pattern[0]).to.
        be.an.instanceof(asts.ArrayPattern);

      expect(ast.clauses[0].pattern[0]).to.
        have.property("subpatterns").that.is.empty;

    });

    it("should parse a nonempty array", () => {
      var ast = parse((a) => { [x] >= x })
      expect(ast.clauses[0].pattern[0]).to.
        have.property("subpatterns").that.has.length(1);
    });

    it("should parse the rest construct", () => {
      var ast = parse((a) => { [x, ...xs] >= x })
      expect(ast.clauses[0].pattern[0]).to.
        have.property("subpatterns").that.has.length(1);
      
      expect(ast.clauses[0].pattern[0].restpattern).to.
        be.instanceof(asts.VariablePattern)
    });

    it("should parse the advanced rest construct", () => {
      var ast = parse((a) => { [x, ...2] >= x })
      expect(ast.clauses[0].pattern[0].restpattern).to.
        be.instanceof(asts.ValuePattern)
    });
  
    it("should all pattern", () => {
      var ast = parse((a) => { [...2] >= x })
      expect(ast.clauses[0].pattern[0].subpatterns).to.
        have.length(0)
      expect(ast.clauses[0].pattern[0].restpattern).to.
        be.instanceof(asts.ValuePattern)
    });
  });
});

