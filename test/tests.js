"use strict";

// var expect = require('chai').expect,

var expect = chai.expect

describe("transform", () => {

  it("should return a readable function", () => {
    var str = transform((a) => { 1 >= 0 } )

var x = function (a) {
  if ( a === 1 ) {
    return 0;
  }
}
    expect(str).to.equal(x.toString());
  });
  
  it("should accept multible clauses", () => {
    var str = transform((a) => { 
        1 >= 0 
      | 2 >= 2
    } )

var x = function (a) {
  if ( a === 1 ) {
    return 0;
  }
  if ( a === 2 ) {
    return 2;
  }
}
    expect(str).to.equal(x.toString());
  });

  it("should manage vaiables", () => {
    var str = transform((a) => { 
        x >= x + 2
    } )

var x = function (a) {
  var x;
  if ( x = a || true ) {
    return x + 2;
  }
}
    expect(str).to.have.string(x.toString());
  });

  it("should match recursively", () => {
var x = function (a) {
  var x,y;
  if ( a instanceof Array && a.length === 2 && (x = a[0] || true) && (y = a[1] || true) ) {
    return x + y;
  }
}
    var str = transform((a) => { 
        [x, y] >= x + y
    } )
    expect(str).to.have.equal(x.toString());
  });
  it("should match rest", () => {
var x = function (a) {
  var x,y;
  if ( a instanceof Array && a.length === 2 && (x = a[0] || true) && (y = a[1] || true) ) {
    return x + y;
  }
}
    var str = transform((a) => { 
        [x, ...xs] >= xs
    })
    console.log(x.toString()) 
    console.log(str)
  });
});

describe("parse", () => {
  it("should parse a simple match", () => {
    var ast = parse((a) => {
      10 >= 2
    });
    expect(ast).to.be.an.instanceof(MatchObject);
    expect(ast).to.have.property("args").eql(["a"])
    expect(ast).to.have.property("clauses").with.length(1)

    expect(ast).to.have.property("clauses")
      .with.deep.property("[0]")
        .that.is.a.instanceof(Clause)
    
    expect(ast.clauses[0]).to.have.property("pattern")
      .that.is.a.instanceof(ValuePattern);
    
    expect(ast.clauses[0]).to.have.property("pattern")
      .that.has.property("value", 10);

    expect(ast.clauses[0]).to.have.property("doBlock", "2");
  });
  
  it("should parse a float match", () => {
    var ast = parse((a) => { 1.1 >= 0 })
    
    expect(ast.clauses[0]).to.have.property("pattern")
      .that.has.property("value", 1.1);
  });

  it("should parse a string match", () => {
    var ast = parse((a) => { "some_string" >= 0 })
    expect(ast.clauses[0]).to.have.property("pattern")
      .that.has.property("value", "some_string");
  });
  
  it("should parse a string match with escapes", () => {
    var ast = parse((a) => { "some\n\"ng" >= 0 })
    expect(ast.clauses[0]).to.have.property("pattern")
      .that.has.property("value", "some\n\"ng");
  });

  it("should parse a variable", () => {
    var ast = parse((a) => { x >= x })
    
    expect(ast.clauses[0]).to.have.property("pattern")
      .that.is.a.instanceof(VariablePattern);
    expect(ast.clauses[0]).to.have.property("pattern")
      .that.has.property("name", "x");
  });

  describe("using an array", () => {
    it("should parse the empty array", () => {
      var ast = parse((a) => { [] >= x })
    
      expect(ast.clauses[0].pattern).to.
        be.an.instanceof(ArrayPattern);

      expect(ast.clauses[0].pattern).to.
        have.property("subpatterns").that.is.empty;

    });

    it("should parse a nonempty array", () => {
      var ast = parse((a) => { [x] >= x })
      expect(ast.clauses[0].pattern).to.
        have.property("subpatterns").that.has.length(1);
    });

    it("should parse the rest construct", () => {
      var ast = parse((a) => { [x, ...xs] >= x })
      expect(ast.clauses[0].pattern).to.
        have.property("subpatterns").that.has.length(1);
      
      expect(ast.clauses[0].pattern.restpattern).to.
        be.instanceof(RestArrayPattern)
    });

    it("should parse the advanced rest construct", () => {
      var ast = parse((a) => { [x, ...2] >= x })
      expect(ast.clauses[0].pattern.restpattern).to.
        be.instanceof(ValuePattern)
    });
  });
});

