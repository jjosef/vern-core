var expect = require("chai").expect;

describe("Setup vern", function() {
  var vern = require('../lib');

  new vern().then(function($vern) {
    describe("when an event is called", function() {
      it("should call the event method with {some: 'data'}", function() {
        $vern.on('testEvent', function (data) {
          console.log(arguments);
          expect(data).to.have.property('some');
        });

        $vern.emit('testEvent', {some: 'data'}, 'test', ['Joe', 'Mary']);
      });
    });
  });
});