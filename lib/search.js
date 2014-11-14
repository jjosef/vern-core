var extend = require('node.extend'),
    util   = require("./util");

var _buildSearchClauses = function(searchParams,searchField, options) {
  var boundaryRegex = options.wholeWords ? "\\b" : "";
  var result =[];

  for (var j in searchParams[searchField]) {
    var searchClause = {};
    var value = searchParams[searchField][j];
    if (!options.isRegex) value = util.escapeRegex(value);
    searchClause[searchField] = new RegExp(boundaryRegex + value + boundaryRegex, options.regexOptions);
    result.push(searchClause);
  }
  return result;
}

var _createSearchConditions = function(search, options) {
  var primaryOrClause = [];

  for (var i in search) {
    if (typeof search[i] === "string") {
      search[i] = [search[i]];
    }

    if (options.searchType === "AND") {
      var searchClauses = _buildSearchClauses(search, i, options);
      var criteria;
      if (searchClauses.length == 1){
        criteria = searchClauses[0];
      } else {
        criteria =  {"$and": searchClauses}
      }
      primaryOrClause.push(criteria);
    } else {
      var searchClauses = _buildSearchClauses(search, i, options);
      primaryOrClause = primaryOrClause.concat(searchClauses);
    }
  }

  return primaryOrClause;
}

module.exports = {
  convertSearchToConditions: function(search, conditions, options) {
    var defaults = {
      searchType: "OR",
      regexOptions:"ig",
      wholeWords: false,
      isRegex: true
    }

    var options = extend({}, defaults, options);

    options.searchType = options.searchType.toUpperCase();
    if (options.searchType !== "AND" && options.searchType !== "OR") {
      options.searchType = defaults.searchType;
    }

    if (typeof options.wholeWords !== "boolean") options.wholeWords = defaults.wholeWords;

    if(Object.keys(search).length) {
      var searchOrClause = _createSearchConditions(search, options)
      util.mergeOrClauseIntoExistingConditions(conditions, searchOrClause);
    }
  }
}