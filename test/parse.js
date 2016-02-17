var chai = chai || require('chai')
var like = like || require('../src/like.js')
var _ = _ || require('lodash')

var expect = chai.expect
var asts = like.ast;

function parse(fn) {
  return like.parse.parse(fn.toString())
}

describe("parse", () => {
  it("should parse a simple match", () => {
    var ast = parse((a) => (
      10 >= 2
    ));
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
    var ast = parse((a) => ( 1.1 >= 0 ))
    
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("value", 1.1);
  });
  
  it("should parse multible arguments", () => {
    var ast = parse((a, b) => ( 
        1.1 >= 0 
      | x >= 1
    ))
    expect(ast.args).to.have.length(2);
  });

  it("should parse a multible patterns", () => {
    var ast = parse((a) => (
        1.1 >= 0 
      | x >= 1
    ))
    
    expect(ast.clauses).to.have.length(2);
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("value", 1.1);
  });

  it("should parse multi-patterns", () => {
    var ast = parse((a, b) => (
        1.1, 1 >= 0 
      | 0, 1 >= 1
    ))
    
    expect(ast.clauses[0]).to.have.property("pattern")
      .that.has.length(2);
  });

  it("should parse a string match", () => {
    var ast = parse((a) => ( "some_string" >= 0 ))
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("value", "some_string");
  });
  
  it("should parse a wildcard", () => {
    var ast = parse((a) => ( _ >= 0 ))
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.is.an.instanceof(asts.WildcardPattern)
  });
  
  it("should parse a string match with escapes", () => {
    var ast = parse((a) => ( "some\n\"ng" >= 0 ))
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("value", "some\n\"ng");
  });

  it("should parse a variable", () => {
    var ast = parse((a) => ( x >= x ))
    
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.is.a.instanceof(asts.VariablePattern);
    expect(ast.clauses[0]).to.have.deep.property("pattern[0]")
      .that.has.property("name", "x");
  });

  it("should parse a datum", () => {
    var ast = parse(a => ( Point(x_, y_) >= x_
          ));
    var x = ast.clauses[0].pattern[0]
    expect(x).to.be.instanceof(asts.DatumPattern);
    expect(x).to.have.property("name", "Point");
    expect(x).to.have.property("args");
  });

  it("should parse an object", () => {
    var ast = parse(a => (
        {x: _, y: x}, z >= x_
    ));
    var x = ast.clauses[0].pattern[0]
    expect(x).to.be.instanceof(asts.ObjectPattern);
    expect(x).to.have.property("attrs").to.have.length(2);
    expect(x.attrs[0]).to.be.instanceof(asts.AttrPattern);
  });

  describe("using an array", () => {
    it("should parse the empty array", () => {
      var ast = parse((a) => ( [] >= x ))
    
      expect(ast.clauses[0].pattern[0]).to.
        be.an.instanceof(asts.ArrayPattern);

      expect(ast.clauses[0].pattern[0]).to.
        have.property("subpatterns").that.is.empty;

    });

    it("should parse a nonempty array", () => {
      var ast = parse((a) => ( [x] >= x ))
      expect(ast.clauses[0].pattern[0]).to.
        have.property("subpatterns").that.has.length(1);
    });

    it("should parse the rest construct", () => {
      var ast = parse((a) => ( [x, ...xs] >= x ))
      expect(ast.clauses[0].pattern[0]).to.
        have.property("subpatterns").that.has.length(1);
      
      expect(ast.clauses[0].pattern[0].restpattern).to.
        be.instanceof(asts.VariablePattern)
    });

    it("should parse the advanced rest construct", () => {
      var ast = parse((a) => ( [x, ...2] >= x ))
      expect(ast.clauses[0].pattern[0].restpattern).to.
        be.instanceof(asts.ValuePattern)
    });
  
    it("should all pattern", () => {
      var ast = parse((a) => ( [...2] >= x ))
      expect(ast.clauses[0].pattern[0].subpatterns).to.
        have.length(0)
      expect(ast.clauses[0].pattern[0].restpattern).to.
        be.instanceof(asts.ValuePattern)
    });

  });
});

