/**
 * Created by alextypefoo on 3/24/14.
 */
var vern = require('../lib/index');
var util = require('util');

new vern().then(function($vern) {

  var PostModel = function(){
    this.title = null;
    this.author = null;
    this.body = null;

    return this.update(arguments[0]);

  };
  $vern.models.PostModel = new $vern.model().extend(PostModel, {
    collection: 'posts'
    });
  $vern.controllers.BlogController = new $vern.controller().init({
    model: $vern.models.PostModel,
    publicRoute: '/posts', // public GET access
    publicPostRoute: '/posts', // public POST access
    publicDeleteRoute: '/posts' // public DELETE access
  });
}).fail(function(err) { // handle errors here
    console.log(err);
  });