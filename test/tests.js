"use strict";

// var expect = require('chai').expect,

var expect = chai.expect

describe("parse", () => {
  it("should parse a simple match", () => {
    var ast = parse((a) => {
      10 >= 2
    });
    expect(ast).to.be.an.instanceof(MatchObject);
    expect(ast).to.have.property("matchArgs").eql(["a"])
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
  });

});
