var matchtree = matchtree || require("../src/matchtree.js")
var like = like || require("../dist/like-v1.0.0.js")

var chai = chai || require('chai')
var expect = chai.expect

var parse = like.parse

describe("matchtree", () => {
  it("should match a single args", () => {
    var ast = parse(a => { 
          1.1 >= 0 
    })
    expect(matchtree.toMatchTree(ast)).to.deep.equal({ 
      first: {should: 1.1, target: "a"},
      then: { expr: "0" }
    });
  });
  it("should match a wildcard", () => {
    var ast = parse(a => { 
          _ >= 0 
    })
    expect(matchtree.toMatchTree(ast)).to.deep.equal({ expr: "0" });
  });
  it("should match multible args", () => {
    var ast = parse((a, b) => { 
          1, 2 >= x
    })
    expect(matchtree.toMatchTree(ast)).to.deep.equal({
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
    expect(matchtree.toMatchTree(ast)).to.deep.equal(
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
      expect(matchtree.toMatchTree(ast)).to.deep.equal({
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
      expect(matchtree.toMatchTree(ast)).to.deep.equal({
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
      expect(matchtree.toMatchTree(ast)).to.deep.equal({
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
      expect(matchtree.toMatchTree(ast)).to.deep.equal({
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

