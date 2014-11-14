var expect = require("chai").expect;

describe("util", function() {
  var searchModule = require("../lib/search")
  var options, conditions;
  describe("#convertSearchToConditions", function() {
    beforeEach(function() {
      options = {};
      conditions = {type:"stream"};
    })
    describe("when wholeWords is true", function() {

      beforeEach(function () {
        options.wholeWords = true;
      });

      describe("when each search field contains one term", function() {
        it("should return a regex that looks for full word", function() {
          var search = {title: "single", body:"single"};
          var expectedConditions = {
            type:"stream",
            "$or": [
              {title: /\bsingle\b/ig},
              {body: /\bsingle\b/ig},
            ]
          }

          searchModule.convertSearchToConditions(search, conditions, options);
          expect(conditions).to.eql(expectedConditions);
        });
      })
      describe("when searchType is AND", function() {
        beforeEach(function() {
          options.searchType = "AND";
        });

        describe("when each search field contains multiple terms in an array", function() {
          it("should return a regex that looks for all words (as complete words)", function() {
            var search = {title: ["one", "two"], body:["one", "two"]};
            var expectedConditions = {
              type:"stream",
              "$or": [
                {"$and" : [
                  {title: /\bone\b/ig},
                  {title: /\btwo\b/ig},
                ]},
                {"$and": [
                  {body: /\bone\b/ig},
                  {body: /\btwo\b/ig},
                ]},
              ]
            };

            searchModule.convertSearchToConditions(search, conditions, options);
            expect(conditions).to.eql(expectedConditions);
          });
        });
      });
      describe("when searchType is OR", function() {
        beforeEach(function() {
          options.searchType = "OR";
        });

        describe("when each search field contains multiple terms in an array", function() {
          it("should return a regex that looks for any of the words (as complete words)", function() {
            var search = {title: ["one", "two"], body:["one", "two"]};
            var expectedConditions = {
              type:"stream",
              "$or": [
                {title: /\bone\b/ig},
                {title: /\btwo\b/ig},
                {body: /\bone\b/ig},
                {body: /\btwo\b/ig},
              ]
            };

            searchModule.convertSearchToConditions(search, conditions, options);
            expect(conditions).to.eql(expectedConditions);
          });
        });
      });
    });
    describe("when wholeWords is false", function() {
      var conditions;

      beforeEach(function () {
        conditions = {type:"stream"};
        options.wholeWords = false;
      });

      describe("when each search field contains one term", function() {
        it("should return a regex that looks for full word", function() {
          var search = {title: "single", body:"single"};
          var expectedConditions = {
            type:"stream",
            "$or": [
              {title: /single/ig},
              {body: /single/ig},
            ]
          }

          searchModule.convertSearchToConditions(search, conditions, options);
          expect(conditions).to.eql(expectedConditions);
        });
      })
      describe("when searchType is AND", function() {
        beforeEach(function() {
          options.searchType = "AND";
        });

        describe("when each search field contains multiple terms in an array", function() {
          it("should return a regex that looks for all words (as complete words)", function() {
            var search = {title: ["one", "two"], body:["one", "two"]};
            var expectedConditions = {
              type:"stream",
              "$or": [
                {"$and" : [
                  {title: /one/ig},
                  {title: /two/ig},
                ]},
                {"$and": [
                  {body: /one/ig},
                  {body: /two/ig},
                ]},
              ]
            };

            searchModule.convertSearchToConditions(search, conditions, options);
            expect(conditions).to.eql(expectedConditions);
          });
        });
      });
      describe("when searchType is OR", function() {
        beforeEach(function() {
          options.searchType = "OR";
        });
        describe("when each search field contains multiple terms in an array", function() {
          it("should return a regex that looks for any of the words (as complete words)", function() {
            var search = {title: ["one", "two"], body:["one", "two"]};
            var expectedConditions = {
              type:"stream",
              "$or": [
                {title: /one/ig},
                {title: /two/ig},
                {body: /one/ig},
                {body: /two/ig},
              ]
            };

            searchModule.convertSearchToConditions(search, conditions, options);
            expect(conditions).to.eql(expectedConditions);
          });
        });
      });
    });
    describe("when wholeWords is an invalid value", function() {
      beforeEach(function() {
        options.wholeWords = "not a boolean";
      });

      it("should default to wholeWords = false", function() {
          var search = {title: "single", body:"single"};
          var expectedConditions = {
            type:"stream",
            "$or": [
              {title: /single/ig},
              {body: /single/ig},
            ]
          }

          searchModule.convertSearchToConditions(search, conditions, options);
          expect(conditions).to.eql(expectedConditions);
      })
    })
    describe("when searchType is not specified", function() {
      it("should default to OR", function() {
        var search = {title: ["one", "two"], body:["one", "two"]};
        var expectedConditions = {
          type:"stream",
          "$or": [
            {title: /one/ig},
            {title: /two/ig},
            {body: /one/ig},
            {body: /two/ig},
          ]
        };

        searchModule.convertSearchToConditions(search, conditions, options);
        expect(conditions).to.eql(expectedConditions);
      });
    });
    describe("when searchType is neither AND or OR", function() {
      beforeEach(function() {
        options.searchType = "NEITHER_AND_OR_ANDOR_OR_OR_HODOR"
      });
      it("should default to OR", function() {
        var search = {title: ["one", "two"], body:["one", "two"]};
        var expectedConditions = {
          type:"stream",
          "$or": [
            {title: /one/ig},
            {title: /two/ig},
            {body: /one/ig},
            {body: /two/ig},
          ]
        };

        searchModule.convertSearchToConditions(search, conditions, options);
        expect(conditions).to.eql(expectedConditions);
      });
    });
    describe("when the conditions already contains an $or clause", function() {
      beforeEach(function() {
        conditions = {type:"stream", "$or":[{"owner_id":"54545454345"}, {"privacy":"public"}]};
      });
      it("should handle that appropriately", function() {

        var search = {title: "single", body:"single"};
        var expectedConditions = {
          type:"stream",
          "$and": [
            {
              "$or": [
                {title: /single/ig},
                {body: /single/ig}
              ]
            }, {
              "$or": [
                {"owner_id":"54545454345"},
                {"privacy":"public"}
              ]
            }
          ]
        }

        searchModule.convertSearchToConditions(search, conditions, options);
        expect(conditions).to.eql(expectedConditions);
      });
    });
    describe("options.isRegex", function() {
      it("should escape the search criteria when options.isRegex is false", function() {
        options.isRegex = false;
        var search = {title: "s(i)|ng.l*e+", body:"s(i)|ng.l*e+"};
        var expectedConditions = {
          type:"stream",
          "$or": [
            {title: /s\(i\)\|ng\.l\*e\+/ig},
            {body: /s\(i\)\|ng\.l\*e\+/ig},
          ]
        }

        searchModule.convertSearchToConditions(search, conditions, options);
        expect(conditions).to.eql(expectedConditions);
      });

      it("should NOT escape the search criteria when options.isRegex is true", function() {
        options.isRegex = true;
        var search = {title: "s(i)|ng.l*e+", body:"s(i)|ng.l*e+"};
        var expectedConditions = {
          type:"stream",
          "$or": [
            {title: /s(i)|ng.l*e+/ig},
            {body: /s(i)|ng.l*e+/ig},
          ]
        }

        searchModule.convertSearchToConditions(search, conditions, options);
        expect(conditions).to.eql(expectedConditions);
      });

      it("should default to true when not specified", function() {
        var search = {title: "s(i)|ng.l*e+", body:"s(i)|ng.l*e+"};
        var expectedConditions = {
          type:"stream",
          "$or": [
            {title: /s(i)|ng.l*e+/ig},
            {body: /s(i)|ng.l*e+/ig},
          ]
        }

        searchModule.convertSearchToConditions(search, conditions, options);
        expect(conditions).to.eql(expectedConditions);
      })
    });
  });
});