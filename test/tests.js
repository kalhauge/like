"use strict";

// var expect = require('chai').expect,
var chai = chai || require('chai')
var like = like || require('../src/like.js')
var _ = _ || require('lodash')

var expect = chai.expect
var compile = like.compile, translate = like.translate;
var asts = like.ast;

function pp(fn) {
  return "\n" +  fn.toString() + "\n"
}

describe("compile", () => {

  it("can make a fib series", () => {
    var fib_ = compile((a, fib) => (
        0 >= 1 
      | 1 >= 1
      | n >= fib(n - 1) + fib(n - 2)
    ));
    function fib (n) { return fib_(n, fib); }
    expect(fib(2)).to.equal(2, pp(fib_));
    expect(fib(3)).to.equal(3);
    expect(fib(4)).to.equal(5);
  });
  it("can use recursive calls", () => {
    var fib = compile(a => (
        0 >= 1 
      | 1 >= 1
      | n >= rec(n - 1) + rec(n - 2)
    ));
    expect(fib(2)).to.equal(2, pp(fib));
    expect(fib(3)).to.equal(3);
    expect(fib(4)).to.equal(5);
  });
  it("can do zip of lists", () => {
    var zip = compile((a, b, _) => (
        [x, ...xs], [y, ...ys] >= _.concat([[x,y]], rec(xs, ys, _))
      | []        , _          >= []
      | _         , []         >= []
    ));
    expect(zip([1,2], [3, 4], _)).to.eql([[1,3], [2,4]], pp(zip));
    expect(zip([1], [3, 4], _)).to.eql([[1,3]]);
    expect(zip([1, 2], [3], _)).to.eql([[1,3]]);
  });
  it("matches on many twoes", () => {
    var twoes = compile(a => (
        [...2] >= true
      | _      >= false
    ));
    expect(twoes([2, 2, 2])).to.equal(true, pp(twoes));
    expect(twoes([2, 1, 2])).to.equal(false);
  });
  
  it("matches everything in an array", () => {
    var array = compile(a => (
        [..._] >= true
      | _      >= false
    ));
    expect(array([1, 2, 3])).to.equal(true, pp(array));
    expect(array([2, 1, "a"])).to.equal(true);
    expect(array(false)).to.equal(false, pp(array));
  });
  
  it("matches on first 1 and then 2s", () => {
    var twoes = compile(a => (
       [1, ...2] >= true
      | _        >= false
    ));
    expect(twoes([1, 2, 2])).to.equal(true, pp(twoes));
    expect(twoes([1, 1, 2])).to.equal(false);
  });
  
  it("matches recusive many arrays", () => {
    var transpose = compile(a => (
        [...[xs, ys]] >= [xs, ys]
    ));
    expect(transpose([[1,2], [1, 2], [1, 2]])).to.eql([[1,1,1], [2,2,2]], pp(transpose));
  });
  
  it("matches double recusive", () => {
    var transpose = compile(a => (
        [...[xs, ...ys]] >= [xs, ys]
    ));
    expect(transpose([[1,2], [1, 2], [1, 2]])).to.eql([[1,1,1], [[2],[2],[2]]], pp(transpose));
  });
  
  it("matches datums", () => {
    var getx = compile(a => (
        Point(x1, 3) >= x1 
      | _ >= 0
    ));
    function Point(x, y) {
      this.x = x;
      this.y = y;
    };
    expect(getx(new Point(2, 3))).to.equal(2, pp(getx));
    expect(getx({x: 2, y:3})).to.equal(0, pp(getx));
  });
  
  it("matches partial objects", () => {
    var getx = compile(a => (
        {x: x1} >= x1 
      | _ >= 0
    ));
    function Point(x, y) {
      this.x = x;
      this.y = y;
    };
    expect(getx(new Point(2, 3))).to.equal(2, pp(getx));
    expect(getx({x: 2, y:3})).to.equal(2, pp(getx));
  });
  
  it("full lists does not match empty", () => {
    var getx = compile(a => (
        [] >= true
        | _ >= false
    ));
    expect(getx([1,2])).to.equal(false);
    expect(getx([])).to.equal(true);
  });
  
  it("empty args is allowed", () => {
    var test = compile(() => (
          [], x, y >= 1
        | [], x, _ >= 2
        | []       >= 3
        | _        >= 4
    ));
    expect(test([], 1, 2)).to.equal(1);
    expect(test([], 1)).to.equal(2);
    expect(test([])).to.equal(3);
    expect(test()).to.equal(4);
  });

  it("should be able to make a server", () => {
    function OK(data) {
      return { status: 200, data: data }
    }

    var server = { 
      x: 0,
      post: function(x) {
        this.x = x;
        return OK(this.x);
      },
      get: function () {
        return OK(this.x);
      },
    }

    var dispatch = like.compile(msg => [server] || (
          { method: "POST", data: x} >= server.post(x)
        | { method: "GET"}           >= server.get()
    ))

    dispatch({method: "POST", data: 1})
    expect(server.x).to.be.equal(1);
    
    dispatch({method: "POST", data: 10})
    expect(dispatch({method: "GET"})).to.have.property("data", 10)
  });

  it("support global scoping", () => { 
    var a = 1, b = 2; 

    var opr = like.compile(msg => [a, b] || (
        "add" >= a + b
      | "mult" >= a * b
    ));
    
    expect(opr("add")).to.be.equal(3);
    b = 4
    expect(opr("mult")).to.be.equal(4);

  });
  

});

