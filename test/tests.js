"use strict";

// var expect = require('chai').expect,

var expect = chai.expect
var compile = like.compile, parse = like.parse, translate = like.translate;
var ast = like.ast;

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
    console.log(fib);
    expect(fib(2)).to.equal(2);
    expect(fib(3)).to.equal(3);
    expect(fib(4)).to.equal(5);
  });
  it("can do zip of lists", () => {
    var zip = compile((a, b) => {
        [x, ...xs], [y, ...ys] >= _.concat([[x,y]], rec(xs, ys))
      | []        , _          >= []
      | _         , []         >= []
    });
    expect(zip([1,2], [3, 4])).to.eql([[1,3], [2,4]]);
    expect(zip([1], [3, 4])).to.eql([[1,3]]);
    expect(zip([1, 2], [3])).to.eql([[1,3]]);
  });
  it("do match on many twoes", () => {
    var twoes = compile(a => {
        [...2] >= true
      | _      >= false
    });
    expect(twoes([2, 2, 2])).to.equal(true, twoes.toString());
    expect(twoes([2, 1, 2])).to.equal(false, twoes.toString());
  });
  
  it("do match on first 1 and then 2s", () => {
    var twoes = compile(a => {
       [1, ...2] >= true
      | _        >= false
    });
    expect(twoes([2, 2, 2])).to.equal(true);
    expect(twoes([2, 1, 2])).to.equal(false);
  });
  
  it("do match recusive many arrays", () => {
    var transpose = compile(a => {
        [...[xs, ys]] >= [xs, ys]
    });
    expect(transpose([[1,2], [1, 2], [1, 2]])).to.eql([[1,1,1], [2,2,2]]);
  });

});

describe("translate", () => {
  
  it("should match the wildcard", () => {
    var str = translate((a) => { _ >= 0 } )

var x = function (a) {
  if ( (true) ) {
    return 0;
  }
}
    expect(str).to.equal(x.toString());
  });

  it("should return a readable function", () => {
    var str = translate((a) => { 1 >= 0 } )

var x = function (a) {
  if ( (a === 1) ) {
    return 0;
  }
}
    expect(str).to.equal(x.toString());
  });
  
  it("should accept multible clauses", () => {
    var str = translate((a) => { 
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
    var str = translate((a) => { 
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
    var str = translate((a) => { 
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
    var str = translate((a) => { 
        [x, ...xs] >= xs
    })
    console.log(x.toString()) 
    console.log(str)
    expect(str).to.have.equal(x.toString());
  });

  it("should match multi-patterns", () => {
var x = function (a,b) {
  var x,y;
  if ( (x = a || true) && (y = b || true) ) {
    return x + y;
  }
}    
    var str = translate((a, b) => { 
        x, y >= x + y
    })
    console.log(x.toString()) 
    console.log(str)
    expect(str).to.have.equal(x.toString());
    
  });
});

describe("parse", () => {
  it("should parse a simple match", () => {
    var ast = parse((a) => {
      10 >= 2
    });
    expect(ast).to.be.an.instanceof(ast.MatchObject);
    expect(ast).to.have.property("args").eql(["a"])
    expect(ast).to.have.property("clauses").with.length(1)

    expect(ast).to.have.property("clauses")
      .with.deep.property("[0]")
        .that.is.a.instanceof(ast.Clause)
    
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.is.a.instanceof(ast.ValuePattern);
    
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
      .that.is.an.instanceof(ast.WildcardPattern)
  });
  
  it("should parse a string match with escapes", () => {
    var ast = parse((a) => { "some\n\"ng" >= 0 })
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("value", "some\n\"ng");
  });

  it("should parse a variable", () => {
    var ast = parse((a) => { x >= x })
    
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.is.a.instanceof(ast.VariablePattern);
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("name", "x");
  });

  describe("using an array", () => {
    it("should parse the empty array", () => {
      var ast = parse((a) => { [] >= x })
    
      expect(ast.clauses[0].pattern[0]).to.
        be.an.instanceof(ast.ArrayPattern);

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
        be.instanceof(ast.VariablePattern)
    });

    it("should parse the advanced rest construct", () => {
      var ast = parse((a) => { [x, ...2] >= x })
      expect(ast.clauses[0].pattern[0].restpattern).to.
        be.instanceof(ast.ValuePattern)
    });
  
    it("should all pattern", () => {
      var ast = parse((a) => { [...2] >= x })
      expect(ast.clauses[0].pattern[0].subpatterns).to.
        have.length(0)
      expect(ast.clauses[0].pattern[0].restpattern).to.
        be.instanceof(ast.ValuePattern)
    });
  });

});

